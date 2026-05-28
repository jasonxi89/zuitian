import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-4-7")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/rizz.db")
AGENT_ENABLED = os.getenv("AGENT_ENABLED", "true").lower() == "true"
