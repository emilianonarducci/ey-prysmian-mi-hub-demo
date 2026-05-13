"""Review Queue API — Human-in-the-loop workflow.

State is kept in-memory for the demo (resets on container restart). In Phase 1
production this maps to a `review_decisions` table with FK to bronze/silver items.

Workflow:
    draft  -> validated  (Accept)
    draft  -> rejected   (Reject)
    draft  -> validated  (Edit + Accept)
    validated -> published  (after editorial workflow, auto in demo)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timezone
from backend.db.connection import get_db
from backend.db.models import NewsCurated, MiningProject

router = APIRouter(prefix="/review", tags=["review"])

# {item_id -> {status, feedback, decided_at, decided_by, edited_title}}
_DECISIONS: dict[str, dict] = {}

# Synthetic confidence per item (deterministic from id hash to stay stable)
def _confidence(item_id: str) -> int:
    h = sum(ord(c) for c in str(item_id))
    return 65 + (h % 31)  # 65..95

def _ai_reason(item_type: str, item) -> str:
    if item_type == "news":
        countries = item.countries or []
        return (
            f"Flagged by News Finder agent: matches Prysmian taxonomy "
            f"(segments: {', '.join(item.segments or []) or 'general'}; "
            f"geography: {', '.join(countries) or 'global'}). "
            f"Relevance score: {float(item.relevance_score):.2f}."
        )
    return (
        f"Flagged by Project Scouting agent: {item.project_type or 'mining'} project in "
        f"{item.country or 'unspecified region'} with estimated "
        f"${float(item.capex_estimate_musd or 0):,.0f}M CAPEX. "
        f"Cable demand exposure: ~{float(item.cable_demand_estimate_km or 0):,.0f} km."
    )


class Decision(BaseModel):
    status: str  # "validated" | "rejected" | "published"
    feedback: str | None = None
    edited_title: str | None = None
    decided_by: str | None = None


@router.get("/queue")
def get_queue(
    item_type: str | None = None,  # "news" | "project" | None=all
    status_filter: str = "draft",   # "draft" | "validated" | "rejected" | "all"
    limit: int = 50,
    db: Session = Depends(get_db),
):
    items = []

    if item_type in (None, "news"):
        news_list = db.execute(
            select(NewsCurated)
            .order_by(NewsCurated.curated_at.desc())
            .limit(limit)
        ).scalars().all()
        for n in news_list:
            d = _DECISIONS.get(str(n.id), {})
            st = d.get("status", "draft")
            if status_filter != "all" and st != status_filter:
                continue
            items.append({
                "item_id": str(n.id),
                "item_type": "news",
                "title": d.get("edited_title") or n.title,
                "original_title": n.title,
                "summary": n.summary,
                "source": n.source,
                "url": n.url,
                "country": (n.countries or [None])[0],
                "segments": n.segments or [],
                "confidence": _confidence(n.id),
                "ai_reason": _ai_reason("news", n),
                "agent": "news_finder",
                "evidence_id": str(n.evidence_id) if n.evidence_id else None,
                "curated_at": n.curated_at.isoformat() if n.curated_at else None,
                "status": st,
                "feedback": d.get("feedback"),
                "decided_at": d.get("decided_at"),
                "decided_by": d.get("decided_by"),
            })

    if item_type in (None, "project"):
        projects = db.execute(
            select(MiningProject).order_by(MiningProject.curated_at.desc()).limit(limit)
        ).scalars().all()
        for p in projects:
            d = _DECISIONS.get(str(p.id), {})
            st = d.get("status", "draft")
            if status_filter != "all" and st != status_filter:
                continue
            items.append({
                "item_id": str(p.id),
                "item_type": "project",
                "title": d.get("edited_title") or p.name,
                "original_title": p.name,
                "summary": f"{p.project_type or 'Mining'} · {p.owner or 'Unknown owner'} · {p.status or 'status unknown'}",
                "source": p.source_url or "internal",
                "url": p.source_url,
                "country": p.country,
                "segments": [p.project_type] if p.project_type else [],
                "confidence": _confidence(p.id),
                "ai_reason": _ai_reason("project", p),
                "agent": "project_scouting",
                "evidence_id": str(p.evidence_id) if p.evidence_id else None,
                "curated_at": p.curated_at.isoformat() if p.curated_at else None,
                "status": st,
                "feedback": d.get("feedback"),
                "decided_at": d.get("decided_at"),
                "decided_by": d.get("decided_by"),
            })

    items.sort(key=lambda x: x.get("curated_at") or "", reverse=True)
    return {"items": items, "total": len(items)}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_news = db.execute(select(func.count()).select_from(NewsCurated)).scalar() or 0
    total_proj = db.execute(select(func.count()).select_from(MiningProject)).scalar() or 0
    total = total_news + total_proj
    by_status = {"draft": 0, "validated": 0, "rejected": 0, "published": 0}
    for d in _DECISIONS.values():
        by_status[d["status"]] = by_status.get(d["status"], 0) + 1
    by_status["draft"] = total - sum(v for k, v in by_status.items() if k != "draft")
    return {"by_status": by_status, "total_items": total, "decisions_logged": len(_DECISIONS)}


@router.post("/{item_id}/decide")
def decide(item_id: str, decision: Decision):
    if decision.status not in ("validated", "rejected", "published", "draft"):
        raise HTTPException(400, "Invalid status")
    _DECISIONS[item_id] = {
        "status": decision.status,
        "feedback": decision.feedback,
        "edited_title": decision.edited_title,
        "decided_at": datetime.now(timezone.utc).isoformat(),
        "decided_by": decision.decided_by or "demo.user@prysmian.com",
    }
    return {"ok": True, "item_id": item_id, **_DECISIONS[item_id]}
