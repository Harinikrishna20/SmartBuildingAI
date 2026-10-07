from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()

from .user import User
from .service_request import ServiceRequest
from .utility_usage import UtilityUsage
from .notification import Notification
