import logging
from sqlalchemy.orm import Session
from app.models import Phrase

logger = logging.getLogger(__name__)


def save_new_phrases(db: Session, phrases: list[dict]) -> int:
    """Write new phrases to DB, skip duplicates by content. Returns count of newly added."""
    added = 0
    for p in phrases:
        content = p.get("content", "").strip()
        if not content:
            continue
        exists = db.query(Phrase).filter(Phrase.content == content).first()
        if exists:
            logger.debug("Skipping duplicate: %s", content[:30])
            continue
        db.add(Phrase(
            content=content,
            category=p.get("category", "高甜语录"),
            tags=p.get("tags", ""),
            is_pickup_line=p.get("is_pickup_line", False),
        ))
        added += 1
    if added:
        db.commit()
    return added
