from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from backend.db.connection import get_db
from backend.db.models import NewsCurated, MiningProject

router = APIRouter(prefix="/search", tags=["search"])

KNOWN_COUNTRIES = [
    {"id": "italy", "name": "Italy"},
    {"id": "france", "name": "France"},
    {"id": "germany", "name": "Germany"},
    {"id": "spain", "name": "Spain"},
    {"id": "netherlands", "name": "Netherlands"},
]

@router.get("")
def global_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    q_lower = q.lower()
    like = f"%{q}%"

    news_items = db.execute(
        select(NewsCurated)
        .where(or_(NewsCurated.title.ilike(like), NewsCurated.summary.ilike(like)))
        .order_by(NewsCurated.published_at.desc())
        .limit(limit)
    ).scalars().all()

    project_items = db.execute(
        select(MiningProject)
        .where(or_(
            MiningProject.name.ilike(like),
            MiningProject.owner.ilike(like),
            MiningProject.country.ilike(like),
        ))
        .limit(limit)
    ).scalars().all()

    countries = [c for c in KNOWN_COUNTRIES if q_lower in c["name"].lower() or q_lower in c["id"]][:limit]

    return {
        "query": q,
        "news": [
            {"id": str(n.id), "title": n.title, "source": n.source, "url": n.url,
             "published_at": n.published_at.isoformat() if n.published_at else None,
             "countries": n.countries}
            for n in news_items
        ],
        "projects": [
            {"id": str(p.id), "name": p.name, "owner": p.owner, "country": p.country,
             "status": p.status, "flagged_of_interest": p.flagged_of_interest}
            for p in project_items
        ],
        "countries": countries,
        "totals": {
            "news": len(news_items),
            "projects": len(project_items),
            "countries": len(countries),
        },
    }
