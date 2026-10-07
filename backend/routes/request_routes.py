from datetime import datetime

from flask import Blueprint, g, request

from models import ServiceRequest, User, db
from services.issue_classifier import IssueClassifier
from services.priority_engine import PriorityEngine
from utils.auth import get_current_user, role_required, token_required
from utils.responses import create_notification, error_response, success_response

request_bp = Blueprint("request_bp", __name__)


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

    classification = IssueClassifier.classify_issue(description)
    priority = PriorityEngine.calculate_priority(
        issue_type=classification["possible_issue"],
        description=description,
        utility_anomaly=0,
        waiting_hours=0,
    )

    request_obj = ServiceRequest(
        resident_id=current_user.id,
        category=category,
        description=description,
        photo_url=data.get("photo_url"),
        latitude=data.get("latitude", current_user.latitude),
        longitude=data.get("longitude", current_user.longitude),
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

    return success_response({"request": request_obj.to_dict()}, 201)


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
    return success_response({"requests": [request.to_dict() for request in requests]})


@request_bp.route("/api/requests/<int:request_id>", methods=["GET"])
@token_required
def get_request_details(request_id):
    current_user = get_current_user()
    request_obj = ServiceRequest.query.get_or_404(request_id)
    if current_user.role == "resident" and request_obj.resident_id != current_user.id:
        return error_response("Forbidden", 403)
    if current_user.role == "provider" and request_obj.provider_id != current_user.id and request_obj.provider_id is not None:
        return error_response("Forbidden", 403)

    timeline = [
        {"status": "Requested"},
        {"status": "Accepted"} if request_obj.provider_id else None,
        {"status": "In Progress"} if request_obj.status in {"In Progress", "Completed"} else None,
        {"status": "Completed"} if request_obj.status == "Completed" else None,
    ]
    timeline = [item for item in timeline if item is not None]

    provider_data = None
    if request_obj.provider_id:
        provider = User.query.get(request_obj.provider_id)
        from utils.location import distance_km

        provider_data = {
            "id": provider.id,
            "name": provider.name,
            "distance_km": round(distance_km(request_obj.latitude, request_obj.longitude, provider.latitude, provider.longitude), 2),
        }

    payload = request_obj.to_dict()
    payload["provider"] = provider_data
    payload["timeline"] = timeline
    return success_response({"request": payload})


@request_bp.route("/api/requests/<int:request_id>/accept", methods=["POST"])
@token_required
@role_required("provider")
def accept_request(request_id):
    current_user = get_current_user()
    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.provider_id and request_obj.provider_id != current_user.id:
        return error_response("Request already assigned to another provider", 409)

    request_obj.provider_id = current_user.id
    request_obj.status = "Accepted"
    request_obj.accepted_at = datetime.utcnow()
    db.session.commit()

    create_notification(
        request_obj.resident_id,
        "Request accepted",
        f"Your maintenance request has been accepted by {current_user.name}.",
        "REQUEST",
    )

    return success_response({"request": request_obj.to_dict()})


@request_bp.route("/api/requests/<int:request_id>/status", methods=["PATCH"])
@token_required
@role_required("provider")
def update_request_status(request_id):
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    allowed_statuses = {"Accepted", "In Progress", "Completed"}

    if new_status not in allowed_statuses:
        return error_response("Status must be Accepted, In Progress, or Completed", 400)

    request_obj = ServiceRequest.query.get_or_404(request_id)
    if request_obj.provider_id != current_user.id:
        return error_response("You can only update requests assigned to you", 403)

    current_status = request_obj.status
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

    create_notification(
        request_obj.resident_id,
        "Service update",
        f"Your maintenance request is now marked as {new_status}.",
        "MAINTENANCE",
    )

    return success_response({"request": request_obj.to_dict()})
