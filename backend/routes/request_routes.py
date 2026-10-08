from datetime import datetime

from flask import Blueprint, g, request

from models import ProviderRequestDismissal, ServiceRequest, User, db
from services.issue_classifier import IssueClassifier
from services.priority_engine import PriorityEngine
from services.provider_matching import service_category_match
from utils.auth import get_current_user, role_required, token_required
from utils.location import distance_km
from utils.responses import create_notification, error_response, success_response

request_bp = Blueprint("request_bp", __name__)


def build_request_timeline(request_obj):
    current_stage = {
        "Requested": "provider_matched" if request_obj.provider_id else "request_submitted",
        "Accepted": "provider_accepted",
        "In Progress": "in_progress",
        "Completed": "resolved",
    }.get(request_obj.status, "request_submitted")
    timeline_steps = [
        ("request_submitted", "Request submitted", True),
        ("ai_classified", "AI classified", True),
        ("priority_assigned", "Priority assigned", True),
        ("provider_matched", "Provider matched", bool(request_obj.provider_id)),
        ("provider_accepted", "Provider accepted", request_obj.status in {"Accepted", "In Progress", "Completed"}),
        ("in_progress", "Work in progress", request_obj.status in {"In Progress", "Completed"}),
        ("resolved", "Problem resolved", request_obj.status == "Completed"),
    ]
    return [
        {
            "key": key,
            "status": label,
            "completed": completed,
            "current": key == current_stage,
        }
        for key, label, completed in timeline_steps
    ]


def format_request_payload(request_obj, include_resident=True, current_user=None):
    payload = request_obj.to_dict()
    payload["status_label"] = "Pending" if request_obj.status == "Requested" else request_obj.status
    payload["timeline"] = build_request_timeline(request_obj)

    if request_obj.provider_id:
        provider = User.query.get(request_obj.provider_id)
        if provider:
            from utils.location import distance_km
            dist = 0.5
            if (
                request_obj.latitude is not None
                and request_obj.longitude is not None
                and provider.latitude is not None
                and provider.longitude is not None
            ):
                dist = round(distance_km(request_obj.latitude, request_obj.longitude, provider.latitude, provider.longitude), 2)
            payload["provider"] = {
                "id": provider.id,
                "name": provider.name,
                "service_category": provider.service_category,
                "distance_km": dist,
            }
            payload["provider_name"] = provider.name
            payload["providerName"] = provider.name

    if include_resident:
        resident = User.query.get(request_obj.resident_id)
        if resident:
            payload["resident_name"] = resident.name

    if current_user and current_user.role == "provider" and request_obj.provider_id != current_user.id:
        payload.pop("resident_id", None)
        payload.pop("latitude", None)
        payload.pop("longitude", None)
        payload.pop("address", None)

    return payload


@request_bp.route("/api/requests", methods=["POST"])
@token_required
def create_request():
    current_user = get_current_user()
    if current_user.role != "resident":
        return error_response("Only residents can create requests", 403)

    data = request.get_json(silent=True) or {}
    category = data.get("category") or "Other"
    description = data.get("description")
    if not description:
        return error_response("Description is required", 400)

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude is not None:
        try:
            latitude = float(latitude)
        except (TypeError, ValueError):
            return error_response("Latitude must be a valid number", 400)
        if latitude < -90 or latitude > 90:
            return error_response("Latitude must be between -90 and 90", 400)
    if longitude is not None:
        try:
            longitude = float(longitude)
        except (TypeError, ValueError):
            return error_response("Longitude must be a valid number", 400)
        if longitude < -180 or longitude > 180:
            return error_response("Longitude must be between -180 and 180", 400)

    classification = IssueClassifier.classify_issue(description)
    priority = PriorityEngine.calculate_priority(
        issue_type=classification["possible_issue"],
        description=description,
        utility_anomaly=0,
        waiting_hours=0,
    )

    preferred_provider_id = data.get("preferred_provider_id")
    preferred_provider = None
    if preferred_provider_id is not None:
        try:
            preferred_provider_id = int(preferred_provider_id)
        except (TypeError, ValueError):
            return error_response("Selected provider is invalid", 400)
        preferred_provider = User.query.filter_by(id=preferred_provider_id, role="provider").first()
        if not preferred_provider or preferred_provider.availability != "Available":
            return error_response("Selected provider is unavailable", 400)
        if not service_category_match(classification["suggested_category"], preferred_provider.service_category):
            return error_response("Selected provider does not match this issue category", 400)
        request_latitude = latitude if latitude is not None else current_user.latitude
        request_longitude = longitude if longitude is not None else current_user.longitude
        if request_latitude is None or request_longitude is None or preferred_provider.latitude is None or preferred_provider.longitude is None:
            return error_response("Location is required to confirm this provider", 400)
        if distance_km(request_latitude, request_longitude, preferred_provider.latitude, preferred_provider.longitude) > 10:
            return error_response("Selected provider is outside the 10 km service area", 400)

    request_obj = ServiceRequest(
        resident_id=current_user.id,
        provider_id=preferred_provider.id if preferred_provider else None,
        category=category,
        description=description,
        photo_url=data.get("photo_url"),
        latitude=latitude if latitude is not None else current_user.latitude,
        longitude=longitude if longitude is not None else current_user.longitude,
        address=data.get("address", current_user.location),
        ai_category=classification["suggested_category"],
        ai_issue=classification["possible_issue"],
        priority_score=classification["priority_score"],
        priority_level=classification["priority_level"],
        priority_reason=classification["reason"],
        status="Requested",
    )
    db.session.add(request_obj)
    db.session.commit()

    create_notification(
        current_user.id,
        "Maintenance request created",
        f"Your {category} request has been submitted and is being reviewed.",
        "REQUEST",
    )
    if preferred_provider:
        create_notification(
            preferred_provider.id,
            "New service request",
            f"A nearby resident requested {classification['suggested_category']} service.",
            "MAINTENANCE",
        )

    return success_response({"request": format_request_payload(request_obj)}, 201)


@request_bp.route("/api/requests", methods=["GET"])
@token_required
def get_requests():
    current_user = get_current_user()
    if current_user.role != "resident":
        return error_response("Only residents can view their requests", 403)

    query = ServiceRequest.query.filter_by(resident_id=current_user.id)
    status = request.args.get("status")
    if status:
        query = query.filter(ServiceRequest.status == status)

    requests = query.order_by(ServiceRequest.created_at.desc()).all()
    return success_response({"requests": [format_request_payload(req) for req in requests]})


@request_bp.route("/api/requests/<int:request_id>", methods=["GET"])
@token_required
def get_request_details(request_id):
    current_user = get_current_user()
    request_obj = ServiceRequest.query.get_or_404(request_id)
    if current_user.role == "resident" and request_obj.resident_id != current_user.id:
        return error_response("Forbidden", 403)
    if current_user.role == "provider" and request_obj.provider_id not in {None, current_user.id}:
        return error_response("Forbidden", 403)

    payload = format_request_payload(request_obj, current_user=current_user)
    return success_response({"request": payload})


@request_bp.route("/api/requests/<int:request_id>/accept", methods=["POST"])
@token_required
@role_required("provider")
def accept_request(request_id):
    current_user = get_current_user()
    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.status != "Requested":
        return error_response("This request is no longer available", 409)
    if request_obj.provider_id and request_obj.provider_id != current_user.id:
        return error_response("Request already assigned to another provider", 409)

    request_obj.provider_id = current_user.id
    request_obj.status = "Accepted"
    request_obj.accepted_at = datetime.utcnow()
    db.session.commit()

    create_notification(
        request_obj.resident_id,
        "Request accepted",
        f"{current_user.name} accepted your maintenance request.",
        "REQUEST",
    )

    return success_response({"request": format_request_payload(request_obj)})


@request_bp.route("/api/requests/<int:request_id>/reject", methods=["POST"])
@token_required
@role_required("provider")
def reject_request(request_id):
    current_user = get_current_user()
    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.status != "Requested" or request_obj.provider_id not in {None, current_user.id}:
        return error_response("This request is no longer available", 409)

    dismissal = ProviderRequestDismissal.query.filter_by(provider_id=current_user.id, request_id=request_obj.id).first()
    if not dismissal:
        db.session.add(ProviderRequestDismissal(provider_id=current_user.id, request_id=request_obj.id))
        db.session.commit()
    return success_response({"dismissed": True})


@request_bp.route("/api/requests/<int:request_id>/provider", methods=["POST"])
@token_required
@role_required("resident")
def assign_provider(request_id):
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    try:
        provider_id = int(data.get("provider_id"))
    except (TypeError, ValueError):
        return error_response("Provider ID is required", 400)

    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.resident_id != current_user.id:
        return error_response("Forbidden", 403)
    if request_obj.status != "Requested" or request_obj.provider_id is not None:
        return error_response("This request already has a provider or is no longer available", 409)

    provider = User.query.filter_by(id=provider_id, role="provider").first()
    if not provider or provider.availability != "Available":
        return error_response("Selected provider is unavailable", 400)
    if not service_category_match(request_obj.ai_category or request_obj.category, provider.service_category):
        return error_response("Selected provider does not match this issue category", 400)
    if request_obj.latitude is None or request_obj.longitude is None or provider.latitude is None or provider.longitude is None:
        return error_response("Location is required to confirm this provider", 400)
    if distance_km(request_obj.latitude, request_obj.longitude, provider.latitude, provider.longitude) > 10 and not provider.is_demo:
        return error_response("Selected provider is outside the 10 km service area", 400)

    request_obj.provider_id = provider.id
    db.session.commit()
    create_notification(
        provider.id,
        "New service request",
        f"A nearby resident requested {request_obj.ai_category or request_obj.category} service.",
        "MAINTENANCE",
    )
    return success_response({"request": format_request_payload(request_obj)})


@request_bp.route("/api/requests/<int:request_id>/status", methods=["PATCH"])
@token_required
@role_required("provider")
def update_request_status(request_id):
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    raw_status = (data.get("status") or "").strip()
    status_map = {
        "requested": "Requested",
        "accepted": "Accepted",
        "in progress": "In Progress",
        "in_progress": "In Progress",
        "completed": "Completed",
    }
    new_status = status_map.get(raw_status.lower(), raw_status)

    allowed_statuses = {"Accepted", "In Progress", "Completed"}
    if new_status not in allowed_statuses:
        return error_response("Status must be Accepted, In Progress, or Completed", 400)

    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.provider_id != current_user.id:
        return error_response("You can only update requests assigned to you", 403)

    current_status = request_obj.status
    if current_status == new_status:
        return success_response({"request": format_request_payload(request_obj)})

    valid_transitions = {
        "Requested": {"Accepted"},
        "Accepted": {"In Progress"},
        "In Progress": {"Completed"},
    }
    if new_status not in valid_transitions.get(current_status, set()):
        return error_response(f"Invalid transition from {current_status} to {new_status}", 400)

    request_obj.status = new_status
    if new_status == "Accepted" and not request_obj.accepted_at:
        request_obj.accepted_at = datetime.utcnow()
    if new_status == "Completed":
        request_obj.completed_at = datetime.utcnow()

    db.session.commit()

    if new_status == "Accepted":
        notif_title = "Request accepted"
        notif_msg = f"{current_user.name} accepted your maintenance request."
    elif new_status == "In Progress":
        notif_title = "Work in progress"
        notif_msg = "Your maintenance request is now in progress."
    else:  # Completed
        notif_title = "Request completed"
        notif_msg = "Your maintenance request has been completed."

    create_notification(
        request_obj.resident_id,
        notif_title,
        notif_msg,
        "MAINTENANCE",
    )

    return success_response({"request": format_request_payload(request_obj)})
