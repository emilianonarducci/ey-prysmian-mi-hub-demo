from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class EvidenceMetadataOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    agent_name: str
    agent_version: str
    prompt_version: str
    model_id: str
    source_urls: list[str] | None
    source_snapshots_hash: list[str] | None
    tool_calls: list[dict] | None
    retrieved_context: list[dict] | None
    structured_output: dict | None
    validation_checks: dict | None
    confidence_summary: str | None
    started_at: datetime
    completed_at: datetime
    latency_ms: int | None
    tokens_used: int | None
