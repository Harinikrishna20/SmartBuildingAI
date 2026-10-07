from functools import wraps

import jwt
from flask import g, request

from config import Config
from models import User
from utils.responses import error_response


def create_token(user):
    import datetime as dt

    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": dt.datetime.utcnow() + dt.timedelta(days=7),
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def get_token_from_request():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        return None
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return auth_header.strip()


def get_current_user():
    token = get_token_from_request()
    if not token:
        return None
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
    user = User.query.get(payload.get("user_id"))
    return user


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return error_response("Unauthorized", 401)
        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return error_response("Unauthorized", 401)
            if user.role not in allowed_roles:
                return error_response("Forbidden", 403)
            g.current_user = user
            return f(*args, **kwargs)

        return decorated

    return decorator
