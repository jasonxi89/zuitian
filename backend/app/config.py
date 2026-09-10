import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://api.deepseek.com")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek-flash")
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "deepseek-flash")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/rizz.db")
AGENT_ENABLED = os.getenv("AGENT_ENABLED", "true").lower() == "true"
