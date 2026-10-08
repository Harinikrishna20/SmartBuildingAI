import unittest
from datetime import date, timedelta
from types import SimpleNamespace

from flask import Flask

from config import Config
from models import UtilityUsage, User, db
from routes.auth_routes import auth_bp
from routes.provider_routes import provider_bp
from routes.public_utility_routes import find_historical_anomaly
from routes.request_routes import request_bp
from routes.utility_routes import utility_bp
from services.ai_prediction import build_prediction_for_user
from services.health_score import compute_health_score
from utils.auth import create_token


class RequestLifecycleTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask("request-lifecycle-test")
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            JWT_SECRET_KEY=Config.JWT_SECRET_KEY,
        )
        db.init_app(self.app)
        self.app.register_blueprint(auth_bp)
        self.app.register_blueprint(utility_bp)
        self.app.register_blueprint(request_bp)
        self.app.register_blueprint(provider_bp)
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        self.resident = User(
            name="Test Resident",
            email="resident@test.invalid",
            role="resident",
            latitude=12.0,
            longitude=77.0,
        )
        self.resident.set_password("test-only-password")
        self.provider = User(
            name="Test Provider",
            email="provider@test.invalid",
            role="provider",
            service_category="Plumber",
            availability="Available",
            latitude=12.005,
            longitude=77.005,
        )
        self.provider.set_password("test-only-password")
        db.session.add_all([self.resident, self.provider])
        db.session.commit()
        self.client = self.app.test_client()
        self.resident_headers = {"Authorization": f"Bearer {create_token(self.resident)}"}
        self.provider_headers = {"Authorization": f"Bearer {create_token(self.provider)}"}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_classify_assign_accept_and_complete(self):
        description = "Water is continuously leaking underneath the kitchen sink."
        analysis = self.client.post(
            "/api/ai/classify-issue",
            json={"description": description},
            headers=self.resident_headers,
        )
        self.assertEqual(analysis.status_code, 200)
        self.assertEqual(analysis.json["data"]["suggested_category"], "Plumbing")

        created = self.client.post(
            "/api/requests",
            json={
                "category": "Plumbing",
                "description": description,
                "latitude": self.resident.latitude,
                "longitude": self.resident.longitude,
                "address": "Private test address",
                "ai_category": "Plumbing",
                "ai_issue": "Water Leakage",
            },
            headers=self.resident_headers,
        )
        self.assertEqual(created.status_code, 201)
        request_id = created.json["data"]["request"]["id"]

        open_requests = self.client.get("/api/providers/requests", headers=self.provider_headers)
        self.assertEqual(open_requests.status_code, 200)
        self.assertEqual(len(open_requests.json["data"]["requests"]), 1)
        self.assertNotIn("address", open_requests.json["data"]["requests"][0])
        self.assertNotIn("resident_name", open_requests.json["data"]["requests"][0])

        hidden_details = self.client.get(f"/api/requests/{request_id}", headers=self.provider_headers)
        self.assertNotIn("latitude", hidden_details.json["data"]["request"])
        self.assertNotIn("longitude", hidden_details.json["data"]["request"])
        self.assertNotIn("address", hidden_details.json["data"]["request"])

        assigned = self.client.post(
            f"/api/requests/{request_id}/provider",
            json={"provider_id": self.provider.id},
            headers=self.resident_headers,
        )
        self.assertEqual(assigned.status_code, 200)

        accepted = self.client.post(f"/api/requests/{request_id}/accept", headers=self.provider_headers)
        self.assertEqual(accepted.status_code, 200)
        in_progress = self.client.patch(
            f"/api/requests/{request_id}/status",
            json={"status": "In Progress"},
            headers=self.provider_headers,
        )
        self.assertEqual(in_progress.status_code, 200)
        completed = self.client.patch(
            f"/api/requests/{request_id}/status",
            json={"status": "Completed"},
            headers=self.provider_headers,
        )
        self.assertEqual(completed.status_code, 200)

        resident_requests = self.client.get("/api/requests", headers=self.resident_headers)
        self.assertEqual(resident_requests.json["data"]["requests"][0]["status"], "Completed")

    def test_anomaly_requires_prior_reading_baseline(self):
        one_reading = UtilityUsage(
            resident_id=self.resident.id,
            utility_type="water",
            usage_value=500,
            unit="L",
        )
        db.session.add(one_reading)
        db.session.commit()

        insufficient = build_prediction_for_user(self.resident.id, "water")
        self.assertTrue(insufficient["has_data"])
        self.assertFalse(insufficient["has_prediction"])
        self.assertFalse(insufficient["is_anomaly"])
        self.assertIsNone(compute_health_score(self.resident.id)["score"])

        db.session.add_all([
            UtilityUsage(resident_id=self.resident.id, utility_type="water", usage_value=520, unit="L"),
            UtilityUsage(resident_id=self.resident.id, utility_type="water", usage_value=850, unit="L"),
            UtilityUsage(resident_id=self.resident.id, utility_type="electricity", usage_value=8, unit="kWh"),
            UtilityUsage(resident_id=self.resident.id, utility_type="electricity", usage_value=8.2, unit="kWh"),
            UtilityUsage(resident_id=self.resident.id, utility_type="electricity", usage_value=8.1, unit="kWh"),
        ])
        db.session.commit()

        baseline = build_prediction_for_user(self.resident.id, "water")
        self.assertTrue(baseline["has_prediction"])
        self.assertTrue(baseline["is_anomaly"])
        self.assertIn("does not identify the cause", baseline["explanation"])
        self.assertIsNotNone(compute_health_score(self.resident.id)["score"])

    def test_public_anomaly_uses_dataset_history_and_disclaims_cause(self):
        records = [
            SimpleNamespace(
                usage_date=date(2024, 1, 1) + timedelta(days=index),
                usage_value=100.0,
                unit="kWh/day",
            )
            for index in range(30)
        ]
        records.append(SimpleNamespace(
            usage_date=date(2024, 1, 31),
            usage_value=250.0,
            unit="kWh/day",
        ))

        result = find_historical_anomaly(records, "electricity")
        self.assertEqual(result["date"], "2024-01-31")
        self.assertEqual(result["severity"], "Anomaly")
        self.assertIn("does not identify a cause", result["message"])
        self.assertIsNone(find_historical_anomaly(records[:30], "electricity"))

    def test_demo_provider_setup_is_opt_in_and_labeled(self):
        setup = self.client.post("/api/providers/demo-setup", headers=self.resident_headers)
        self.assertEqual(setup.status_code, 200)
        self.assertTrue(setup.json["data"]["demo_data"])
        self.assertEqual(len(setup.json["data"]["providers"]), 3)
        self.assertTrue(all(provider["is_demo"] for provider in setup.json["data"]["providers"]))

        nearby = self.client.get(
            "/api/providers/nearby?latitude=12&longitude=77&category=Plumbing&radius=10",
            headers=self.resident_headers,
        )
        providers = nearby.json["data"]["providers"]
        demo_providers = [provider for provider in providers if provider["is_demo"]]
        self.assertEqual(len(demo_providers), 2)
        self.assertTrue(all("not a real business" in provider["demo_notice"].lower() for provider in demo_providers))

        credentials = setup.json["data"]["provider_login"]
        login = self.client.post("/api/auth/login", json={
            "email": credentials["accounts"][0]["email"],
            "password": credentials["password"],
        })
        self.assertEqual(login.status_code, 200)
        self.assertTrue(login.json["data"]["user"]["is_demo"])


if __name__ == "__main__":
    unittest.main()