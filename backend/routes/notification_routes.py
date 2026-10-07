from flask import Blueprint

from models import Notification, db
from utils.auth import get_current_user, token_required
from utils.responses import error_response, success_response

notification_bp = Blueprint("notification_bp", __name__)


@notification_bp.route("/api/notifications", methods=["GET"])
@token_required
def get_notifications():
    current_user = get_current_user()
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return success_response({"notifications": [item.to_dict() for item in notifications]})


@notification_bp.route("/api/notifications/<int:notification_id>/read", methods=["PATCH"])
@token_required
def mark_notification_read(notification_id):
    current_user = get_current_user()
    notification = Notification.query.get_or_404(notification_id)
    if notification.user_id != current_user.id:
        return error_response("Forbidden", 403)
    notification.is_read = True
    db.session.commit()
    return success_response({"notification": notification.to_dict()})
