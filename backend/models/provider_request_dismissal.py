from datetime import datetime

from . import db


class ProviderRequestDismissal(db.Model):
    __tablename__ = "provider_request_dismissals"
    __table_args__ = (db.UniqueConstraint("provider_id", "request_id"),)

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    request_id = db.Column(db.Integer, db.ForeignKey("service_requests.id"), nullable=False, index=True)
    dismissed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)