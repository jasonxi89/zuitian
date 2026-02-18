from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PhraseOut(BaseModel):
    id: int
    content: str
    category: str
    tags: Optional[str] = None
    is_pickup_line: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ImageContent(BaseModel):
    data: str  # base64 encoded (without data: prefix)
    media_type: str = "image/jpeg"


class ChatRequest(BaseModel):
    their_message: str = ""
    style: str = Field(default="humorous")
    context: Optional[str] = None
    images: Optional[List[ImageContent]] = None


class CategoryOut(BaseModel):
    name: str
    count: int
