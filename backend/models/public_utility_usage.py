from datetime import date, datetime

from . import db


class PublicUtilityUsage(db.Model):
    __tablename__ = "public_utility_usage"
    __table_args__ = (db.UniqueConstraint("dataset_key", "usage_date"),)

    id = db.Column(db.Integer, primary_key=True)
    dataset_key = db.Column(db.String(80), nullable=False, index=True)
    utility_type = db.Column(db.String(30), nullable=False, index=True)
    usage_date = db.Column(db.Date, nullable=False, index=True)
    usage_value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(40), nullable=False)
    source_name = db.Column(db.String(200), nullable=False)
    source_url = db.Column(db.String(500), nullable=False)
    license_name = db.Column(db.String(160), nullable=False)
    geographic_scope = db.Column(db.String(160), nullable=False)
    granularity = db.Column(db.String(30), nullable=False)
    observation_count = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "dataset_key": self.dataset_key,
            "utility_type": self.utility_type,
            "usage_date": self.usage_date.isoformat() if isinstance(self.usage_date, date) else None,
            "usage_value": self.usage_value,
            "unit": self.unit,
            "source_name": self.source_name,
            "source_url": self.source_url,
            "license": self.license_name,
            "geographic_scope": self.geographic_scope,
            "granularity": self.granularity,
            "observation_count": self.observation_count,
        }