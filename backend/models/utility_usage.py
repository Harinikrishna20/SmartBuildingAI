from datetime import datetime

from . import db


class UtilityUsage(db.Model):
    __tablename__ = "utility_usage"

    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    utility_type = db.Column(db.String(30), nullable=False)
    usage_value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(30), nullable=False)
    usage_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "resident_id": self.resident_id,
            "utility_type": self.utility_type,
            "usage_value": self.usage_value,
            "unit": self.unit,
            "usage_date": self.usage_date.isoformat() if self.usage_date else None,
        }
