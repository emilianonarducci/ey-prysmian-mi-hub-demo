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
