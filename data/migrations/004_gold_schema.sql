CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE gold.news_curated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silver_id UUID REFERENCES silver.news_clean(id) ON DELETE SET NULL,
  source VARCHAR(100) NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  relevance_score NUMERIC(4, 3) NOT NULL,
  segments TEXT[],
  countries TEXT[],
  published_at TIMESTAMPTZ,
  curated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_id UUID,
  data_source_label VARCHAR(20) DEFAULT 'live'
);
CREATE INDEX news_curated_relevance_idx ON gold.news_curated(relevance_score DESC);
CREATE INDEX news_curated_published_idx ON gold.news_curated(published_at DESC);

CREATE TABLE gold.mining_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner TEXT,
  country VARCHAR(100),
  project_type VARCHAR(50),
  capex_estimate_musd NUMERIC(12, 2),
  capacity_mw NUMERIC(10, 2),
  start_year INT,
  end_year INT,
  cable_demand_estimate_km NUMERIC(10, 2),
  status VARCHAR(50),
  source_url TEXT,
  flagged_of_interest BOOLEAN DEFAULT FALSE,
  curated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence_id UUID,
  data_source_label VARCHAR(20) DEFAULT 'live'
);
CREATE INDEX mining_projects_country_idx ON gold.mining_projects(country);
CREATE INDEX mining_projects_status_idx ON gold.mining_projects(status);
CREATE INDEX mining_projects_start_year_idx ON gold.mining_projects(start_year);

CREATE TABLE gold.commodity_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal VARCHAR(20) NOT NULL,
  value_usd NUMERIC(14, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  deviation_pct NUMERIC(6, 3),
  evidence_id UUID,
  data_source_label VARCHAR(20) DEFAULT 'live',
  UNIQUE(metal, observed_at)
);
CREATE INDEX commodity_indicators_metal_observed_idx
  ON gold.commodity_indicators(metal, observed_at DESC);

CREATE TABLE gold.market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(100) NOT NULL,
  indicator VARCHAR(50) NOT NULL,
  period DATE NOT NULL,
  value NUMERIC(14, 4),
  ai_insight_narrative TEXT,
  evidence_id UUID,
  data_source_label VARCHAR(20) DEFAULT 'seed',
  UNIQUE(country, indicator, period)
);
CREATE INDEX market_trends_country_indicator_idx
  ON gold.market_trends(country, indicator, period);
