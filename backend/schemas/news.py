from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class NewsItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source: str
    url: str
    title: str
    summary: str
    relevance_score: Decimal
    segments: list[str] | None
    countries: list[str] | None
    published_at: datetime | None
    curated_at: datetime
    evidence_id: UUID | None
    data_source_label: str
