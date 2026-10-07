from flask import jsonify


def success_response(data=None, status_code=200):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code


def error_response(message, status_code=400, details=None):
    payload = {"success": False, "error": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code


def create_notification(user_id, title, message, notification_type="SYSTEM"):
    from models import Notification, db

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    db.session.add(notification)
    db.session.commit()
    return notification
