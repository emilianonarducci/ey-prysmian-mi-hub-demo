"""Alerts inbox + subscription preferences (demo, in-memory).

Synthesizes alerts from existing data:
- KPI alerts: deviations on copper price (peak/trough)
- Project alerts: newly added flagged projects
- News alerts: high-relevance news (>0.7)
- Competitor: news mentioning competitor keywords
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from backend.db.connection import get_db
from backend.db.models import NewsCurated, MiningProject

router = APIRouter(prefix="/alerts", tags=["alerts"])

# In-memory: which alert_ids the user marked as read
_READ_ALERTS: set[str] = set()

# Subscription preferences (single demo user)
_SUBSCRIPTIONS: dict = {
    "channels": {"in_app": True, "email": False, "teams": False},
    "bu": ["transmission", "grid", "renewables"],
    "countries": ["Italy", "France", "Germany"],
    "topics": ["copper", "permits", "competitor_moves", "new_projects"],
    "min_severity": "medium",  # low/medium/high
}

COMPETITOR_KEYWORDS = ["nexans", "nkt", "hellenic", "ls cable", "prysmian"]


def _classify_severity(score: float) -> str:
    if score >= 0.85: return "high"
    if score >= 0.65: return "medium"
    return "low"


@router.get("")
def list_alerts(
    severity: str | None = None,
    type_filter: str | None = None,  # kpi | project | news | competitor
    db: Session = Depends(get_db),
):
    alerts = []

    # Project alerts (flagged)
    projects = db.execute(select(MiningProject).order_by(MiningProject.curated_at.desc()).limit(30)).scalars().all()
    for p in projects:
        if not p.flagged_of_interest:
            continue
        a_id = f"project:{p.id}"
        sev = "high" if (p.capex_estimate_musd or 0) > 500 else "medium"
        alerts.append({
            "id": a_id, "type": "project", "severity": sev,
            "title": f"New flagged project: {p.name}",
            "body": f"{p.owner or 'Unknown'} · {p.country or 'unspecified'} · ${float(p.capex_estimate_musd or 0):,.0f}M CAPEX",
            "country": p.country, "agent": "project_scouting",
            "trigger_reason": "Strategic flag triggered — high CAPEX and Prysmian BU exposure.",
            "timestamp": p.curated_at.isoformat() if p.curated_at else None,
            "read": a_id in _READ_ALERTS,
            "link": f"/projects/{p.id}",
            "confidence": 85,
        })

    # News alerts (high relevance)
    news = db.execute(select(NewsCurated).order_by(NewsCurated.curated_at.desc()).limit(50)).scalars().all()
    for n in news:
        rel = float(n.relevance_score or 0)
        if rel < 0.65:
            continue
        sev = _classify_severity(rel)
        title_lower = (n.title or "").lower()
        is_competitor = any(k in title_lower for k in COMPETITOR_KEYWORDS)
        a_id = f"news:{n.id}"
        alerts.append({
            "id": a_id,
            "type": "competitor" if is_competitor else "news",
            "severity": sev,
            "title": n.title,
            "body": (n.summary or "")[:200],
            "country": (n.countries or [None])[0],
            "agent": "competitor_monitor" if is_competitor else "news_finder",
            "trigger_reason": f"Relevance score {rel:.2f} above {0.65 if sev == 'medium' else 0.85} threshold.",
            "timestamp": n.published_at.isoformat() if n.published_at else (n.curated_at.isoformat() if n.curated_at else None),
            "read": a_id in _READ_ALERTS,
            "link": n.url,
            "confidence": int(rel * 100),
        })

    # Synthetic KPI alerts
    kpi_alerts = [
        {"id": "kpi:copper-spike-2026-05", "type": "kpi", "severity": "high",
         "title": "Copper price breached +5% MoM threshold",
         "body": "LME spot up 5.4% MoM driven by supply tightening in Peru and accelerating EV grid build-out.",
         "country": None, "agent": "kpi_alerts",
         "trigger_reason": "Threshold rule: copper_lme MoM > +5%. Confidence 0.92.",
         "timestamp": "2026-05-12T08:30:00Z", "read": "kpi:copper-spike-2026-05" in _READ_ALERTS,
         "link": "/trends", "confidence": 92},
        {"id": "kpi:italy-permits-drop", "type": "kpi", "severity": "medium",
         "title": "Italy building permits YTD trending -8% YoY",
         "body": "Residential permits in Italy contracted further in April; macro construction outlook downgraded.",
         "country": "Italy", "agent": "kpi_alerts",
         "trigger_reason": "Threshold rule: italy_permits_ytd YoY < -5%. Confidence 0.78.",
         "timestamp": "2026-05-10T06:00:00Z", "read": "kpi:italy-permits-drop" in _READ_ALERTS,
         "link": "/country/italy", "confidence": 78},
    ]
    alerts.extend(kpi_alerts)

    if type_filter:
        alerts = [a for a in alerts if a["type"] == type_filter]
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]

    alerts.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/stats")
def alerts_stats(db: Session = Depends(get_db)):
    all_alerts = list_alerts(db=db)
    items = all_alerts["alerts"]
    by_type = {}
    by_severity = {"high": 0, "medium": 0, "low": 0}
    unread = 0
    for a in items:
        by_type[a["type"]] = by_type.get(a["type"], 0) + 1
        by_severity[a["severity"]] = by_severity.get(a["severity"], 0) + 1
        if not a["read"]:
            unread += 1
    return {"total": len(items), "unread": unread, "by_type": by_type, "by_severity": by_severity}


class ReadStatus(BaseModel):
    read: bool


@router.post("/{alert_id:path}/read")
def mark_read(alert_id: str, body: ReadStatus):
    if body.read:
        _READ_ALERTS.add(alert_id)
    else:
        _READ_ALERTS.discard(alert_id)
    return {"id": alert_id, "read": body.read}


class Subscriptions(BaseModel):
    channels: dict | None = None
    bu: list[str] | None = None
    countries: list[str] | None = None
    topics: list[str] | None = None
    min_severity: str | None = None


@router.get("/subscriptions")
def get_subs():
    return _SUBSCRIPTIONS


@router.put("/subscriptions")
def update_subs(subs: Subscriptions):
    for k, v in subs.model_dump(exclude_none=True).items():
        _SUBSCRIPTIONS[k] = v
    return _SUBSCRIPTIONS
