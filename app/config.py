
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = (
        os.getenv("SECRET_KEY")
        or "unsafe-development-key-change-me"
    )

    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    TESTING = False

    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgres://", "postgresql://", 1
        )

    if (
        DATABASE_URL.startswith("postgresql://")
        and "+psycopg" not in DATABASE_URL
        and "+psycopg2" not in DATABASE_URL
    ):
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1,
        )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL or (
        f"sqlite:///{BASE_DIR / 'instance' / 'partypilot.db'}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Existing Geoapify integration
    GEOAPIFY_API_KEY = os.getenv(
        "GEOAPIFY_API_KEY", ""
    ).strip()

    # Google Places API (New)
    GOOGLE_PLACES_API_KEY = os.getenv(
        "GOOGLE_PLACES_API_KEY", ""
    ).strip()

    MAX_CONTENT_LENGTH = 5 * 1024 * 1024

    CREATE_DB_ON_STARTUP = (
        os.getenv("CREATE_DB_ON_STARTUP", "false").lower()
        == "true"
    )
