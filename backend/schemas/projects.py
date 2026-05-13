from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class MiningProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    owner: str | None
    country: str | None
    project_type: str | None
    capex_estimate_musd: Decimal | None
    capacity_mw: Decimal | None
    start_year: int | None
    end_year: int | None
    cable_demand_estimate_km: Decimal | None
    status: str | None
    source_url: str | None
    flagged_of_interest: bool
    curated_at: datetime
    evidence_id: UUID | None
    data_source_label: str

class ProjectListResponse(BaseModel):
    items: list[MiningProjectOut]
    total: int
    page: int
    page_size: int
