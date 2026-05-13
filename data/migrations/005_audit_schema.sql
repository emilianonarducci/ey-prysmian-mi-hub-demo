CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(100) NOT NULL,
  agent_version VARCHAR(50) NOT NULL,
  triggered_by VARCHAR(100),
  bounded_params JSONB,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  latency_ms INT,
  tokens_input INT,
  tokens_output INT,
  error_message TEXT
);
CREATE INDEX agent_runs_name_started_idx ON audit.agent_runs(agent_name, started_at DESC);

CREATE TABLE audit.evidence_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID NOT NULL REFERENCES audit.agent_runs(id) ON DELETE CASCADE,
  agent_name VARCHAR(100) NOT NULL,
  agent_version VARCHAR(50) NOT NULL,
  prompt_version VARCHAR(100) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  source_urls TEXT[],
  source_snapshots_hash TEXT[],
  tool_calls JSONB,
  retrieved_context JSONB,
  structured_output JSONB,
  validation_checks JSONB,
  confidence_summary TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  latency_ms INT,
  tokens_used INT
);
CREATE INDEX evidence_run_idx ON audit.evidence_metadata(agent_run_id);
CREATE INDEX evidence_agent_idx ON audit.evidence_metadata(agent_name, started_at DESC);
