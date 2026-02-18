from datetime import datetime
from sqlalchemy import Column, Integer, Text, String, Boolean, DateTime, Index
from app.database import Base


class Phrase(Base):
    __tablename__ = "phrases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    tags = Column(String(200), nullable=True)
    is_pickup_line = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
