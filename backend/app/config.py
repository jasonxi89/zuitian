import os
from dotenv import load_dotenv

load_dotenv()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/rizz.db")
