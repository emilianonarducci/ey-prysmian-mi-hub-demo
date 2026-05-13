from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from backend.db.connection import Base

class MiningProject(Base):
    __tablename__ = "mining_projects"
    __table_args__ = {"schema": "gold"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    owner = Column(Text)
    country = Column(String(100))
    project_type = Column(String(50))
    capex_estimate_musd = Column(Numeric(12, 2))
    capacity_mw = Column(Numeric(10, 2))
    start_year = Column(Integer)
    end_year = Column(Integer)
    cable_demand_estimate_km = Column(Numeric(10, 2))
    status = Column(String(50))
    source_url = Column(Text)
    flagged_of_interest = Column(Boolean, default=False)
    curated_at = Column(DateTime(timezone=True), server_default=func.now())
    evidence_id = Column(UUID(as_uuid=True))
    data_source_label = Column(String(20), default="live")

class NewsCurated(Base):
    __tablename__ = "news_curated"
    __table_args__ = {"schema": "gold"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False)
    url = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    relevance_score = Column(Numeric(4, 3), nullable=False)
    segments = Column(ARRAY(String))
    countries = Column(ARRAY(String))
    published_at = Column(DateTime(timezone=True))
    curated_at = Column(DateTime(timezone=True), server_default=func.now())
    evidence_id = Column(UUID(as_uuid=True))
    data_source_label = Column(String(20), default="live")

class CommodityIndicator(Base):
    __tablename__ = "commodity_indicators"
    __table_args__ = {"schema": "gold"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metal = Column(String(20), nullable=False)
    value_usd = Column(Numeric(14, 4), nullable=False)
    unit = Column(String(20), nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    deviation_pct = Column(Numeric(6, 3))
    evidence_id = Column(UUID(as_uuid=True))
    data_source_label = Column(String(20), default="live")

class MarketTrend(Base):
    __tablename__ = "market_trends"
    __table_args__ = {"schema": "gold"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country = Column(String(100), nullable=False)
    indicator = Column(String(50), nullable=False)
    period = Column(DateTime, nullable=False)
    value = Column(Numeric(14, 4))
    ai_insight_narrative = Column(Text)
    evidence_id = Column(UUID(as_uuid=True))
    data_source_label = Column(String(20), default="seed")

class EvidenceMetadata(Base):
    __tablename__ = "evidence_metadata"
    __table_args__ = {"schema": "audit"}
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_run_id = Column(UUID(as_uuid=True), nullable=False)
    agent_name = Column(String(100), nullable=False)
    agent_version = Column(String(50), nullable=False)
    prompt_version = Column(String(100), nullable=False)
    model_id = Column(String(100), nullable=False)
    source_urls = Column(ARRAY(Text))
    source_snapshots_hash = Column(ARRAY(Text))
    tool_calls = Column(JSON)
    retrieved_context = Column(JSON)
    structured_output = Column(JSON)
    validation_checks = Column(JSON)
    confidence_summary = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    latency_ms = Column(Integer)
    tokens_used = Column(Integer)
