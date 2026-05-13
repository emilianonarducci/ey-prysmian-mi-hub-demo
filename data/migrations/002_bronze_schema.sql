CREATE SCHEMA IF NOT EXISTS bronze;

CREATE TABLE bronze.news_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  url TEXT UNIQUE NOT NULL,
  url_hash CHAR(64) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  raw_summary TEXT,
  raw_content TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);
CREATE INDEX news_raw_published_idx ON bronze.news_raw(published_at DESC);
CREATE INDEX news_raw_source_idx ON bronze.news_raw(source);

CREATE TABLE bronze.commodity_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  value_usd NUMERIC(14, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB,
  UNIQUE(metal, source, observed_at)
);
CREATE INDEX commodity_raw_metal_observed_idx ON bronze.commodity_raw(metal, observed_at DESC);

CREATE TABLE bronze.mining_projects_seed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  project_name TEXT NOT NULL,
  owner TEXT,
  country VARCHAR(100),
  project_type VARCHAR(50),
  capex_estimate_musd NUMERIC(12, 2),
  capacity_mw NUMERIC(10, 2),
  start_year INT,
  end_year INT,
  status VARCHAR(50),
  source_url TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB
);
