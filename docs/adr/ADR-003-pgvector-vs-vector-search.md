# ADR-003: pgvector for demo · Phase 1 vector store deferred

Status: Accepted · Date: 2026-04-30

## Context

The Mining Cable Specialist and News Finder agents need similarity
retrieval over a small but growing news / document corpus. Databricks
offers two distinct Phase 1 vector paths: **Lakebase pgvector**
(serverless Postgres for AI, drop-in pgvector compatibility) or
**Delta + Databricks Vector Search** (managed vector index over Delta
tables). The choice has cost, governance, and developer-ergonomics
implications that we cannot adjudicate from a 3-day prototype.

## Decision

- **Demo**: use `pgvector` Postgres extension directly, with an HNSW
  index using `vector_cosine_ops`, on the `silver.news_clean`
  embedding column.
- **Phase 1**: explicitly defer the Lakebase-vs-Delta+Vector-Search
  decision to a Phase 0 spike. Both paths consume the same Pydantic
  contracts and the same prompts; only the retrieval call site
  changes.
- For the demo, if `VOYAGE_API_KEY` is missing, agents fall back to
  keyword search over `silver.news_clean.title || summary` — the
  retrieval interface remains identical from the caller's perspective.

## Alternatives considered

- **Qdrant / Weaviate / Pinecone in Docker** — adds a fifth service
  for negligible Phase 1 value, since neither is the target runtime.
- **Pre-compute and commit a static vector index** — defeats the
  purpose of demonstrating live embedding flows.
- **Commit to Vector Search now** — would force premature commitment;
  Lakebase is materially simpler if Prysmian's data residency and
  governance constraints allow it.

## Consequences

Positive:
- Identical pattern to Lakebase pgvector → Phase 1 port to Lakebase
  is near-zero engineering effort if that path is chosen.
- HNSW + cosine matches the Vector Search default similarity, so
  retrieval-quality benchmarking remains apples-to-apples.

Negative:
- Demo runs without embeddings (keyword fallback) when no Voyage key
  is provisioned — retrieval quality is degraded but functional.
- The Phase 0 spike is a real prerequisite; we should not promise a
  Lakebase outcome before that spike is done.

## References

- Design spec §5.3, §15 Q3, §15 Q4.
- `data/migrations/002_silver.sql`, `agents/tools/vector_search.py`.
