from datetime import datetime, timedelta
import os, sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from models import Notification, ServiceRequest, User, UtilityUsage, db

app = create_app()


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        resident_1 = User(
            name="Harini",
            email="harini@example.com",
            phone="9876543210",
            role="resident",
            location="Bengaluru",
            latitude=12.9716,
            longitude=77.5946,
        )
        resident_1.set_password("password123")

        resident_2 = User(
            name="Aisha",
            email="aisha@example.com",
            phone="9876543212",
            role="resident",
            location="Bengaluru",
            latitude=12.978,
            longitude=77.610,
        )
        resident_2.set_password("password123")

        provider_1 = User(
            name="Raj Kumar",
            email="raj@example.com",
            phone="9876543211",
            role="provider",
            service_category="Plumber",
            location="Bengaluru",
            latitude=12.975,
            longitude=77.600,
            availability="Available",
            experience=5,
        )
        provider_1.set_password("password123")

        provider_2 = User(
            name="Suresh",
            email="suresh@example.com",
            phone="9876543213",
            role="provider",
            service_category="Plumber",
            location="Bengaluru",
            latitude=12.980,
            longitude=77.590,
            availability="Available",
            experience=4,
        )
        provider_2.set_password("password123")

        provider_3 = User(
            name="Anil",
            email="anil@example.com",
            phone="9876543214",
            role="provider",
            service_category="Electrician",
            location="Bengaluru",
            latitude=12.968,
            longitude=77.601,
            availability="Available",
            experience=7,
        )
        provider_3.set_password("password123")

        provider_4 = User(
            name="Manoj",
            email="manoj@example.com",
            phone="9876543215",
            role="provider",
            service_category="Appliance Repair",
            location="Bengaluru",
            latitude=12.975,
            longitude=77.620,
            availability="Busy",
            experience=6,
        )
        provider_4.set_password("password123")

        provider_5 = User(
            name="Kiran",
            email="kiran@example.com",
            phone="9876543216",
            role="provider",
            service_category="Carpenter",
            location="Bengaluru",
            latitude=12.965,
            longitude=77.580,
            availability="Available",
            experience=8,
        )
        provider_5.set_password("password123")

        db.session.add_all([resident_1, resident_2, provider_1, provider_2, provider_3, provider_4, provider_5])
        db.session.commit()

        water_values = [520, 560, 590, 610, 620, 590]
        electricity_values = [8.2, 9.1, 9.8, 10.2, 9.4, 10.8]
        start_date = datetime.utcnow() - timedelta(days=5)

        for idx, value in enumerate(water_values):
            db.session.add(UtilityUsage(resident_id=resident_1.id, utility_type="water", usage_value=value, unit="L", usage_date=start_date + timedelta(days=idx)))
        for idx, value in enumerate(electricity_values):
            db.session.add(UtilityUsage(resident_id=resident_1.id, utility_type="electricity", usage_value=value, unit="kWh", usage_date=start_date + timedelta(days=idx)))

        request_1 = ServiceRequest(
            resident_id=resident_1.id,
            provider_id=provider_1.id,
            category="Plumbing",
            description="Water is continuously leaking from underneath my kitchen sink.",
            latitude=12.9716,
            longitude=77.5946,
            address="Bengaluru",
            ai_category="Plumbing",
            ai_issue="Water Leakage",
            priority_score=87,
            priority_level="High",
            priority_reason="Continuous water leakage can cause property damage and significant water wastage.",
            status="Accepted",
            accepted_at=datetime.utcnow() - timedelta(hours=6),
        )
        request_2 = ServiceRequest(
            resident_id=resident_2.id,
            category="Electrical Issue",
            description="The bedroom light keeps flickering and there is a burning smell.",
            latitude=12.978,
            longitude=77.610,
            address="Bengaluru",
            ai_category="Electrical Issue",
            ai_issue="Electrical Fault",
            priority_score=92,
            priority_level="High",
            priority_reason="Electrical faults may affect safety and power stability in the property.",
            status="Requested",
        )

        db.session.add_all([request_1, request_2])
        db.session.commit()

        Notification.query.filter_by(user_id=resident_1.id).delete()
        Notification.query.filter_by(user_id=provider_1.id).delete()
        db.session.add_all([
            Notification(user_id=resident_1.id, title="AI Alert", message="Water consumption is unusually high. This may indicate a leakage or unusually high usage.", notification_type="AI_ALERT"),
            Notification(user_id=resident_1.id, title="Request accepted", message="Your maintenance request has been accepted by Raj Kumar.", notification_type="REQUEST"),
            Notification(user_id=provider_1.id, title="New nearby request", message="A new plumbing request is available near your area.", notification_type="MAINTENANCE"),
        ])
        db.session.commit()

        print("DEMO DATA CREATED")
        print("Resident login: harini@example.com / password123")
        print("Provider login: raj@example.com / password123")


if __name__ == "__main__":
    seed()
