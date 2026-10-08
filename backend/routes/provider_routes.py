from flask import Blueprint, request

from models import ProviderRequestDismissal, ServiceRequest, User, db
from services.provider_matching import score_provider_match, service_category_match
from utils.auth import get_current_user, role_required, token_required
from utils.location import distance_km
from utils.responses import error_response, success_response

provider_bp = Blueprint("provider_bp", __name__)


@provider_bp.route("/api/providers/demo-setup", methods=["POST"])
@token_required
def setup_demo_providers():
    resident = get_current_user()
    if resident.role != "resident":
        return error_response("Only residents can prepare demo providers", 403)

    data = request.get_json(silent=True) or {}
    try:
        latitude = float(data.get("latitude", resident.latitude))
        longitude = float(data.get("longitude", resident.longitude))
    except (TypeError, ValueError):
        return error_response("Valid location is required to prepare demo providers", 400)
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return error_response("Location coordinates are out of range", 400)

    demo_accounts = [
        {
            "name": "Raj Kumar",
            "email": "raj@example.com",
            "phone": "9876543210",
            "service_category": "Plumbing",
            "experience": 7,
            "latitude_offset": 0.003,
            "longitude_offset": 0.005,
        },
        {
            "name": "Suresh Kumar",
            "email": "suresh@example.com",
            "phone": "9876543211",
            "service_category": "Plumbing",
            "experience": 5,
            "latitude_offset": 0.009,
            "longitude_offset": 0.010,
        },
        {
            "name": "Anil Kumar",
            "email": "anil@example.com",
            "phone": "9876543212",
            "service_category": "Electrical",
            "experience": 6,
            "latitude_offset": 0.005,
            "longitude_offset": 0.003,
        },
    ]
    demo_password = "password123"
    providers = []

    for account in demo_accounts:
        provider = User.query.filter_by(email=account["email"]).first()
        if not provider:
            provider = User(
                name=account["name"],
                email=account["email"],
                phone=account["phone"],
                role="provider",
                is_demo=True,
            )
            provider.set_password(demo_password)
            db.session.add(provider)
        else:
            provider.is_demo = True

        provider.name = account["name"]
        provider.role = "provider"
        provider.service_category = account["service_category"]
        provider.availability = "Available"
        provider.experience = account["experience"]
        provider.location = "Bengaluru (Demo service area)"
        provider.latitude = max(-90, min(90, latitude + account["latitude_offset"]))
        provider.longitude = max(-180, min(180, longitude + account["longitude_offset"]))
        provider.set_password(demo_password)
        providers.append(provider)

    db.session.commit()

    return success_response({
        "demo_data": True,
        "notice": "These clearly labeled demo providers are not real businesses.",
        "provider_login": {
            "password": demo_password,
            "accounts": [{"name": provider.name, "email": provider.email} for provider in providers],
        },
        "providers": [provider.to_dict() for provider in providers],
    })


@provider_bp.route("/api/providers/nearby", methods=["GET"])
@token_required
def nearby_providers():
    current_user = get_current_user()
    if current_user.role != "resident":
        return error_response("Only residents can search nearby providers", 403)

    lat = request.args.get("latitude")
    lon = request.args.get("longitude")
    request_category = request.args.get("category")
    radius = float(request.args.get("radius", 10) or 10)

    if lat is None or lon is None:
        if current_user.latitude is None or current_user.longitude is None:
            return error_response("Resident location is required to find nearby providers", 400)
        lat = current_user.latitude
        lon = current_user.longitude

    try:
        resident_lat = float(lat)
        resident_lon = float(lon)
    except (TypeError, ValueError):
        return error_response("Latitude and longitude must be valid numbers", 400)

    if resident_lat < -90 or resident_lat > 90 or resident_lon < -180 or resident_lon > 180:
        return error_response("Latitude and longitude are out of range", 400)

    providers = User.query.filter_by(role="provider").all()
    results = []

    for provider in providers:
        if provider.availability and provider.availability.lower() == "busy":
            continue

        prov_lat = provider.latitude if provider.latitude is not None else resident_lat + 0.003
        prov_lon = provider.longitude if provider.longitude is not None else resident_lon + 0.005
        distance = distance_km(resident_lat, resident_lon, prov_lat, prov_lon)
        if distance > radius:
            if provider.is_demo:
                distance = 0.8
            else:
                continue

        if request_category and not service_category_match(request_category, provider.service_category):
            continue

        workload = ServiceRequest.query.filter_by(provider_id=provider.id).filter(ServiceRequest.status != "Completed").count()
        provider.current_workload = workload
        stub = type("RequestStub", (), {"category": request_category or "Plumbing"})()
        resident_stub = type("ResidentStub", (), {"latitude": resident_lat, "longitude": resident_lon})()
        provider_stub = type("ProviderStub", (), {
            "id": provider.id,
            "name": provider.name,
            "service_category": provider.service_category,
            "availability": provider.availability,
            "latitude": prov_lat,
            "longitude": prov_lon,
            "current_workload": workload,
            "is_demo": getattr(provider, "is_demo", False),
        })()
        match = score_provider_match(provider_stub, stub, resident_stub)
        if match["is_demo"]:
            match["demo_notice"] = "Sample provider account for demonstration only. Not a real business."
        results.append(match)

    results.sort(key=lambda item: item["match_score"], reverse=True)
    return success_response({"providers": results[:10]})


@provider_bp.route("/api/providers/requests", methods=["GET"])
@token_required
@role_required("provider")
def provider_requests():
    current_user = get_current_user()
    dismissed_ids = [
        dismissal.request_id
        for dismissal in ProviderRequestDismissal.query.filter_by(provider_id=current_user.id).all()
    ]
    requests = ServiceRequest.query.filter(
        ServiceRequest.status == "Requested",
        db.or_(ServiceRequest.provider_id.is_(None), ServiceRequest.provider_id == current_user.id),
        ~ServiceRequest.id.in_(dismissed_ids) if dismissed_ids else db.true(),
    ).all()
    payload = []

    for request_obj in requests:
        resident = User.query.get(request_obj.resident_id)
        if (
            current_user.latitude is not None
            and current_user.longitude is not None
            and request_obj.latitude is not None
            and request_obj.longitude is not None
        ):
            distance = round(distance_km(current_user.latitude, current_user.longitude, request_obj.latitude, request_obj.longitude), 2)
        else:
            distance = 0.6
        payload.append({
            "id": request_obj.id,
            "category": request_obj.category,
            "description": request_obj.description,
            "ai_issue": request_obj.ai_issue,
            "priority_level": request_obj.priority_level,
            "priority_score": request_obj.priority_score,
            "distance_km": distance,
            "status": request_obj.status,
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
