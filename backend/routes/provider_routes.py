from flask import Blueprint, request

from models import ServiceRequest, User, db
from services.provider_matching import score_provider_match
from utils.auth import get_current_user, role_required, token_required
from utils.location import distance_km
from utils.responses import error_response, success_response

provider_bp = Blueprint("provider_bp", __name__)


@provider_bp.route("/api/providers/nearby", methods=["GET"])
@token_required
def nearby_providers():
    current_user = get_current_user()
    if current_user.role != "resident":
        return error_response("Only residents can search nearby providers", 403)

    request_category = request.args.get("category") or "Plumbing"
    providers = User.query.filter_by(role="provider").all()
    results = []

    for provider in providers:
        if not provider.latitude or not provider.longitude:
            continue
        distance = distance_km(current_user.latitude, current_user.longitude, provider.latitude, provider.longitude)
        workload = ServiceRequest.query.filter_by(provider_id=provider.id).filter(ServiceRequest.status != "Completed").count()
        provider.current_workload = workload
        match = score_provider_match(provider, type("RequestStub", (), {"category": request_category})(), current_user)
        if match["distance_km"] < 10 or request_category:
            results.append(match)

    results.sort(key=lambda item: item["match_score"], reverse=True)
    return success_response({"providers": results[:10]})


@provider_bp.route("/api/providers/requests", methods=["GET"])
@token_required
@role_required("provider")
def provider_requests():
    current_user = get_current_user()
    requests = ServiceRequest.query.filter(ServiceRequest.status == "Requested").all()
    payload = []

    for request_obj in requests:
        resident = User.query.get(request_obj.resident_id)
        distance = distance_km(current_user.latitude, current_user.longitude, request_obj.latitude, request_obj.longitude)
        payload.append({
            "id": request_obj.id,
            "category": request_obj.category,
            "description": request_obj.description,
            "ai_issue": request_obj.ai_issue,
            "priority_level": request_obj.priority_level,
            "priority_score": request_obj.priority_score,
            "distance_km": round(distance, 2),
            "address": request_obj.address,
            "status": request_obj.status,
            "resident_name": resident.name if resident else "Resident",
            "created_at": request_obj.created_at.isoformat() if request_obj.created_at else None,
        })

    payload.sort(key=lambda item: item["priority_score"] or 0, reverse=True)
    return success_response({"requests": payload})


@provider_bp.route("/api/providers/jobs", methods=["GET"])
@token_required
@role_required("provider")
def my_jobs():
    current_user = get_current_user()
    jobs = ServiceRequest.query.filter_by(provider_id=current_user.id).order_by(ServiceRequest.created_at.desc()).all()
    return success_response({"jobs": [job.to_dict() for job in jobs]})


@provider_bp.route("/api/providers/profile", methods=["GET"])
@token_required
@role_required("provider")
def provider_profile():
    current_user = get_current_user()
    return success_response({"provider": current_user.to_dict()})


@provider_bp.route("/api/providers/availability", methods=["PATCH"])
@token_required
@role_required("provider")
def update_availability():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    if "availability" in data:
        current_user.availability = data["availability"]
    if "experience" in data:
        current_user.experience = data["experience"]
    db.session.commit()
    return success_response({"provider": current_user.to_dict()})
