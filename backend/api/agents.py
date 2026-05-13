from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID
from backend.db.connection import get_db
from backend.schemas.agents import AgentRunRequest, AgentRunOut

router = APIRouter(prefix="/agents", tags=["agents"])

AGENT_REGISTRY = {}  # populated in Day 2 by agents/__init__.py

@router.post("/{agent_name}/run", response_model=dict)
def trigger_agent(agent_name: str, params: AgentRunRequest, bg: BackgroundTasks, db: Session = Depends(get_db)):
    if agent_name not in AGENT_REGISTRY:
        raise HTTPException(404, f"Agent {agent_name} not registered")
    agent = AGENT_REGISTRY[agent_name]
    run_id = agent.dispatch(bg, params)
    return {"run_id": str(run_id), "status": "running"}

@router.get("/runs", response_model=list[AgentRunOut])
def list_runs(db: Session = Depends(get_db)):
    from backend.db.models import EvidenceMetadata
    # placeholder: query audit.agent_runs table once table exists
    return []
