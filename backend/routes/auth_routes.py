from flask import Blueprint, request

from config import Config
from models import User, db
from services.ai_prediction import build_prediction_for_user
from utils.auth import create_token, get_current_user, token_required
from utils.responses import error_response, success_response

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    required_fields = ["name", "email", "phone", "password", "role"]
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 400)

    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    role = data["role"].strip().lower()

    if role not in {"resident", "provider"}:
        return error_response("Role must be 'resident' or 'provider'", 400)
    if User.query.filter_by(email=email).first():
        return error_response("Email already registered", 409)

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

    user = User(
        name=name,
        email=email,
        phone=data.get("phone"),
        role=role,
        location=data.get("location"),
        latitude=latitude,
        longitude=longitude,
        service_category=data.get("service_category"),
        availability=data.get("availability", "Available" if role == "provider" else None),
        experience=data.get("experience"),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token(user)
    return success_response({"token": token, "user": user.to_dict()}, 201)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    if not email or not password:
        return error_response("Email and password are required", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password", 401)

    token = create_token(user)
    return success_response({"token": token, "user": user.to_dict()})


@auth_bp.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    user = get_current_user()
    return success_response({"user": user.to_dict()})
