from flask import Flask
from flask_cors import CORS

from config import Config
from models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:4173"]}},
        supports_credentials=True,
    )

    with app.app_context():
        from models import User, ServiceRequest, UtilityUsage, Notification  # noqa: F401
        db.create_all()

    from routes.auth_routes import auth_bp
    from routes.request_routes import request_bp
    from routes.provider_routes import provider_bp
    from routes.utility_routes import utility_bp
    from routes.notification_routes import notification_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(request_bp)
    app.register_blueprint(provider_bp)
    app.register_blueprint(utility_bp)
    app.register_blueprint(notification_bp)

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
