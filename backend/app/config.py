import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
APIFY_API_TOKEN: str = os.environ.get("APIFY_API_TOKEN", "")

AUTH_EMAIL: str = os.environ.get("AUTH_EMAIL", "")
AUTH_PASSWORD: str = os.environ.get("AUTH_PASSWORD", "")

UPLOADS_DIR = "uploads"
HISTORY_DIR = "history"
