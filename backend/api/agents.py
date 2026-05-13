from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from uuid import UUID
from backend.db.connection import get_db
from backend.schemas.agents import AgentRunRequest, AgentRunOut
from agents.news_finder import NewsFinderAgent
from agents.mining_cable_specialist import MiningCableSpecialistAgent

router = APIRouter(prefix="/agents", tags=["agents"])

REGISTRY = {
    "news_finder": NewsFinderAgent,
    "mining_cable_specialist": MiningCableSpecialistAgent,
}

def _run_agent_bg(agent_class, params: AgentRunRequest):
    agent = agent_class()
    try:
        agent.run(bounded=params.bounded, max_items=params.max_items, timeout_seconds=params.timeout_seconds)
    except Exception as e:
        print(f"[agent {agent.name}] failed: {e}")

@router.post("/{agent_name}/run")
def trigger_agent(agent_name: str, params: AgentRunRequest, bg: BackgroundTasks, db: Session = Depends(get_db)):
    if agent_name not in REGISTRY:
        raise HTTPException(404, f"Agent {agent_name} not registered")
    bg.add_task(_run_agent_bg, REGISTRY[agent_name], params)
    return {"agent": agent_name, "status": "running"}

@router.get("/runs")
def list_runs(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, agent_name, agent_version, status, started_at, completed_at,
               latency_ms, tokens_input, tokens_output, error_message
        FROM audit.agent_runs ORDER BY started_at DESC LIMIT 50
    """)).all()
    return [dict(r._mapping) for r in rows]


AGENT_CATALOG = [
    {"id": "project_scouting", "name": "Project Scouting",
     "description": "Scouts new mining, grid, data center, BESS and renewable projects from public sources.",
     "category": "scouting", "color": "green", "icon": "Pickaxe",
     "implemented": True, "implementation": "mining_cable_specialist",
     "keywords": ["mining", "grid", "data center", "BESS", "renewable"],
     "geography": ["EU", "UK", "MENA"], "schedule": "Every 6h", "feedback_score": 0.86},
    {"id": "news_finder", "name": "News Finder",
     "description": "Surfaces relevant industry news for the internal newsletter and topic feeds.",
     "category": "news", "color": "blue", "icon": "Newspaper",
     "implemented": True, "implementation": "news_finder",
     "keywords": ["cable", "copper", "energy", "EV", "grid"],
     "geography": ["EU", "Global"], "schedule": "Every 3h", "feedback_score": 0.91},
    {"id": "kpi_alerts", "name": "Micro/Macro KPI Alerts",
     "description": "Monitors KPI thresholds by application/BU and routes alerts when deviations occur.",
     "category": "alerts", "color": "amber", "icon": "AlertCircle",
     "implemented": False, "implementation": None,
     "keywords": ["GDP", "construction output", "permits", "copper price", "interest rates"],
     "geography": ["EU"], "schedule": "Daily", "feedback_score": None},
    {"id": "swift_finder", "name": "Market Trends & Tech Swift Finder",
     "description": "Detects emerging trends and tech shifts that may impact cable demand.",
     "category": "trends", "color": "blue", "icon": "TrendingUp",
     "implemented": False, "implementation": None,
     "keywords": ["HVDC", "solid-state", "subsea", "high-voltage", "smart grid"],
     "geography": ["Global"], "schedule": "Daily", "feedback_score": None},
    {"id": "customer_monitor", "name": "Customer Monitoring",
     "description": "Tracks key customer signals (news, filings, exec changes, project wins).",
     "category": "customer", "color": "green", "icon": "Building2",
     "implemented": False, "implementation": None,
     "keywords": ["Terna", "Enel", "EDF", "RWE", "TenneT"],
     "geography": ["EU"], "schedule": "Every 6h", "feedback_score": None},
    {"id": "competitor_monitor", "name": "Competitor Monitoring",
     "description": "Surfaces competitor moves: announcements, deals, capacity, financials.",
     "category": "competitor", "color": "red", "icon": "Swords",
     "implemented": False, "implementation": None,
     "keywords": ["Nexans", "NKT", "Hellenic Cables", "LS Cable"],
     "geography": ["Global"], "schedule": "Every 6h", "feedback_score": None},
]

_AGENT_STATE: dict[str, dict] = {a["id"]: {"enabled": True} for a in AGENT_CATALOG}


@router.get("/catalog")
def get_catalog(db: Session = Depends(get_db)):
    try:
        runs_rows = db.execute(text("""
            SELECT agent_name, status, started_at, completed_at, latency_ms
            FROM audit.agent_runs ORDER BY started_at DESC
        """)).all()
    except Exception:
        runs_rows = []
    runs_by_agent: dict[str, list] = {}
    for r in runs_rows:
        runs_by_agent.setdefault(r._mapping["agent_name"], []).append(dict(r._mapping))

    out = []
    for a in AGENT_CATALOG:
        impl_name = a.get("implementation")
        runs = runs_by_agent.get(impl_name, []) if impl_name else []
        last = runs[0] if runs else None
        out.append({
            **a,
            "enabled": _AGENT_STATE.get(a["id"], {}).get("enabled", True),
            "last_run": last["started_at"].isoformat() if last and last.get("started_at") else None,
            "last_run_status": last["status"] if last else None,
            "last_run_latency_ms": last.get("latency_ms") if last else None,
            "runs_count": len(runs),
            "successful_runs": sum(1 for r in runs if r.get("status") == "success"),
        })
    return {"agents": out}


@router.post("/{agent_id}/toggle")
def toggle_agent(agent_id: str):
    if agent_id not in _AGENT_STATE:
        raise HTTPException(404, "Agent not in catalog")
    _AGENT_STATE[agent_id]["enabled"] = not _AGENT_STATE[agent_id]["enabled"]
    return {"agent_id": agent_id, "enabled": _AGENT_STATE[agent_id]["enabled"]}
