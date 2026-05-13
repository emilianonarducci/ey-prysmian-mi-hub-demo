from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.db.connection import get_db
from backend.db.models import NewsCurated
from backend.schemas.news import NewsItemOut

router = APIRouter(prefix="/news", tags=["news"])

@router.get("", response_model=list[NewsItemOut])
def list_news(
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(NewsCurated)
    if q:
        stmt = stmt.where(NewsCurated.title.ilike(f"%{q}%") | NewsCurated.summary.ilike(f"%{q}%"))
    items = db.execute(
        stmt.order_by(NewsCurated.published_at.desc())
            .offset((page-1)*page_size).limit(page_size)
    ).scalars().all()
    return [NewsItemOut.model_validate(n) for n in items]
