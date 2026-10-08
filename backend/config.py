import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "database"
DATABASE_DIR.mkdir(exist_ok=True)
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_jwt_secret")
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_DIR / 'smartbuilding.db'}")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_ORIGINS = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()]
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    CORS_HEADERS = "Content-Type"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
