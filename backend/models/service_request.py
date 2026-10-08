from datetime import datetime

from . import db


class ServiceRequest(db.Model):
    __tablename__ = "service_requests"

    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    category = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    ai_category = db.Column(db.String(80), nullable=True)
    ai_issue = db.Column(db.String(120), nullable=True)
    priority_score = db.Column(db.Integer, nullable=True)
    priority_level = db.Column(db.String(30), nullable=True)
    priority_reason = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), nullable=False, default="Requested")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self, include_provider=False):
        data = {
            "id": self.id,
            "resident_id": self.resident_id,
            "provider_id": self.provider_id,
            "category": self.category,
            "description": self.description,
            "photo_url": self.photo_url,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "ai_category": self.ai_category,
            "ai_issue": self.ai_issue,
            "priority_score": self.priority_score,
            "priority_level": self.priority_level,
            "priority_reason": self.priority_reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "accepted_at": self.accepted_at.isoformat() if self.accepted_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
        if include_provider and self.provider:
            data["provider"] = self.provider.to_dict()
        return data
