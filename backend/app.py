from flask import Flask
from flask_cors import CORS
from sqlalchemy import inspect, text

from config import Config
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": list({
                    Config.FRONTEND_URL,
                    *Config.FRONTEND_ORIGINS,
                    "http://localhost:4173",
                    "http://localhost:4174",
                    "https://localhost",
                    "capacitor://localhost",
                })
            }
        },
        supports_credentials=True,
    )

    with app.app_context():
        from models import User, ServiceRequest, UtilityUsage, Notification, PublicUtilityUsage, ProviderRequestDismissal  # noqa: F401
        db.create_all()
        user_columns = {column["name"] for column in inspect(db.engine).get_columns("users")}
        if "is_demo" not in user_columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT 0"))
            db.session.commit()
        from services.seed_data import seed_demo_data
        seed_demo_data()

    from routes.auth_routes import auth_bp
    from routes.request_routes import request_bp
    from routes.provider_routes import provider_bp
    from routes.utility_routes import utility_bp
    from routes.notification_routes import notification_bp
    from routes.public_utility_routes import public_utility_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(request_bp)
    app.register_blueprint(provider_bp)
    app.register_blueprint(utility_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(public_utility_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        from utils.responses import success_response

        return success_response({
            "message": "SmartBuilding AI backend is running",
            "version": "1.0.0",
        })

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
