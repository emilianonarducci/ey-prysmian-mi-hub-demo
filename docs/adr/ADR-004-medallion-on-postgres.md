# ADR-004: Medallion architecture (Bronze / Silver / Gold / Audit) on Postgres

Status: Accepted · Date: 2026-04-30

## Context

Prysmian's Data Platform standards mandate a Databricks medallion
architecture (Bronze → Silver → Gold) backed by Unity Catalog. The
demo cannot run Databricks but can mirror the **conceptual** layout
on Postgres so that schema design, naming conventions, and the
distinction between raw ingestion, validated transformations, and
agent output are all directly portable.

## Decision

Four Postgres schemas, created by migrations 001-005:

- `bronze.*` — raw, append-only, idempotent ingestion with content
  hash deduplication. One table per source (news_raw, copper_lme_raw,
  mining_projects_raw, …).
- `silver.*` — validated, normalized, entity-resolved. Includes the
  `news_clean` table with a pgvector embedding column.
- `gold.*` — agent-produced, UI-facing tables (`mining_projects`,
  `news_curated`, `commodity_indicators`, `market_trends`).
- `audit.*` — `agent_runs` and `evidence_metadata` (ADR-006 schema).

Every gold row carries a `data_source_label` (`seed` / `live`) and an
`evidence_metadata_id` foreign key into `audit.evidence_metadata`.

## Alternatives considered

- **Single schema with table prefixes** — works but is harder to map
  to Unity Catalog schemas in Phase 1.
- **Drop bronze entirely, ingest straight into silver** — would skip
  the idempotency / dedup pattern that becomes important when
  multiple agents share sources.
- **Use DuckDB instead of Postgres** — no pgvector, no concurrent
  writes from the API and the agent worker.

## Consequences

Positive:
- Schema names and column conventions transfer 1:1 to Unity Catalog
  schemas in Phase 1 (`prysmian_mi_hub.{bronze,silver,gold,audit}`).
- Clear separation between deterministic seed (gold seed JSON) and
  runtime-produced rows via `data_source_label`.

Negative:
- More tables / more migrations for a 3-day build than strictly
  necessary, but the structure pays off for documentation and audit
  narrative.

## References

- Design spec §4.4 (data flow), §5.4.
- `data/migrations/001_bronze.sql` through `005_audit.sql`.
- Prysmian "Mandatory deliverables — Data Platform Projects" PDF.
