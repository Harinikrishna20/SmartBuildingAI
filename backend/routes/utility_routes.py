from flask import Blueprint, request

from models import UtilityUsage, User
from services.ai_prediction import build_prediction_for_user
from services.anomaly_detection import assess_anomaly
from services.health_score import compute_health_score
from services.issue_classifier import IssueClassifier
from services.priority_engine import PriorityEngine
from utils.auth import get_current_user, token_required
from utils.responses import error_response, success_response

utility_bp = Blueprint("utility_bp", __name__)


@utility_bp.route("/api/predictions/water", methods=["GET"])
@token_required
def water_prediction():
    current_user = get_current_user()
    data = build_prediction_for_user(current_user.id, "water")
    return success_response(data)


@utility_bp.route("/api/predictions/electricity", methods=["GET"])
@token_required
def electricity_prediction():
    current_user = get_current_user()
    data = build_prediction_for_user(current_user.id, "electricity")
    return success_response(data)


@utility_bp.route("/api/utility/water", methods=["GET"])
@token_required
def water_utility():
    current_user = get_current_user()
    prediction = build_prediction_for_user(current_user.id, "water")
    result = assess_anomaly(
        "water",
        prediction["current_usage"],
        prediction["average_usage"],
        prediction["predicted_usage"],
        prediction["normal_min"],
        prediction["normal_max"],
    )
    return success_response(result)


@utility_bp.route("/api/utility/electricity", methods=["GET"])
@token_required
def electricity_utility():
    current_user = get_current_user()
    prediction = build_prediction_for_user(current_user.id, "electricity")
    result = assess_anomaly(
        "electricity",
        prediction["current_usage"],
        prediction["average_usage"],
        prediction["predicted_usage"],
        prediction["normal_min"],
        prediction["normal_max"],
    )
    return success_response(result)


@utility_bp.route("/api/ai/classify-issue", methods=["POST"])
@token_required
def classify_issue():
    data = request.get_json(silent=True) or {}
    description = (data.get("description") or "").strip()
    if not description:
        return error_response("Description is required", 400)
    result = IssueClassifier.classify_issue(description)
    return success_response(result)


@utility_bp.route("/api/ai/priority", methods=["POST"])
@token_required
def calculate_priority():
    data = request.get_json(silent=True) or {}
    issue_type = data.get("issue_type") or data.get("category") or "Other"
    description = data.get("description") or ""
    utility_anomaly = float(data.get("utility_anomaly", 0) or 0)
    waiting_hours = float(data.get("waiting_hours", 0) or 0)
    result = PriorityEngine.calculate_priority(
        issue_type=issue_type,
        description=description,
        utility_anomaly=utility_anomaly,
        waiting_hours=waiting_hours,
    )
    return success_response(result)


@utility_bp.route("/api/health-score", methods=["GET"])
@token_required
def health_score():
    current_user = get_current_user()
    result = compute_health_score(current_user.id)
    return success_response(result)
