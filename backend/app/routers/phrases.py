from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Phrase
from app.schemas import PhraseOut, CategoryOut

router = APIRouter(prefix="/api/phrases", tags=["phrases"])


@router.get("/", response_model=List[PhraseOut])
def list_phrases(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in content"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
):
    query = db.query(Phrase)
    if category:
        query = query.filter(Phrase.category == category)
    if search:
        query = query.filter(Phrase.content.like(f"%{search}%"))
    return query.order_by(Phrase.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/random", response_model=PhraseOut)
def random_phrase(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    query = db.query(Phrase)
    if category:
        query = query.filter(Phrase.category == category)
    phrase = query.order_by(func.random()).first()
    if not phrase:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No phrases found")
    return phrase


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    results = (
        db.query(Phrase.category, func.count(Phrase.id).label("count"))
        .group_by(Phrase.category)
        .order_by(func.count(Phrase.id).desc())
        .all()
    )
    return [CategoryOut(name=row[0], count=row[1]) for row in results]
