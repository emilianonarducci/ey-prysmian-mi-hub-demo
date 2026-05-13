from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AgentRunOut(BaseModel):
    id: UUID
    agent_name: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    latency_ms: int | None
    tokens_input: int | None
    tokens_output: int | None
    error_message: str | None

class AgentRunRequest(BaseModel):
    bounded: bool = True
    max_items: int = 5
    timeout_seconds: int = 60
