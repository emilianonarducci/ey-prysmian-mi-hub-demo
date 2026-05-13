CREATE SCHEMA IF NOT EXISTS silver;

CREATE TABLE silver.news_clean (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bronze_id UUID NOT NULL REFERENCES bronze.news_raw(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  url_hash CHAR(64) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ,
  language VARCHAR(10),
  embedding vector(1024),
  cleaned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX news_clean_embedding_idx
  ON silver.news_clean USING hnsw (embedding vector_cosine_ops);
CREATE INDEX news_clean_published_idx ON silver.news_clean(published_at DESC);

CREATE TABLE silver.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  canonical_name VARCHAR(255) NOT NULL,
  aliases TEXT[],
  attributes JSONB,
  embedding vector(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, canonical_name)
);
CREATE INDEX entities_embedding_idx
  ON silver.entities USING hnsw (embedding vector_cosine_ops);
CREATE INDEX entities_type_idx ON silver.entities(entity_type);
