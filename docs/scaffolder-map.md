# Scaffolder Map — Reusable vs Disposable

Source: design spec §11. This document is the honest accounting of
what carries forward to Phase 1 and what is rewritten.

## Reusable Phase 1 assets (high port value)

| Asset | Reuse in Phase 1 |
|-------|------------------|
| `data/bronze/sources_catalog.yaml` | Direct: Phase 1 integration backlog |
| `agents/llm/prompts/*.md` (Git-versioned) | Direct: same pattern · prompts copied as-is |
| `agents/eval/golden_*.jsonl` | Direct: imported into Mosaic AI Agent Evaluation managed dataset |
| Pydantic schemas (`backend/schemas/` + `agents/` output schemas) | Direct: schemas are the data contract |
| `data/migrations/*.sql` schema design | Conceptual: Delta table DDL adapted from these |
| UI mockup interpretation + React components | Direct: deployed via Databricks Apps |
| ADRs in `docs/adr/` | Direct: become Phase 1 governance artifacts |
| Mocked UI patterns (AI Insight Card · Evidence Modal · Filters) | Direct: React code reused |

## Disposable / rewritten for Phase 1 (low port value)

| Asset | Phase 1 replacement |
|-------|---------------------|
| `docker-compose.yml` | Databricks managed infrastructure |
| `agents/scheduler.py` (apscheduler) | Databricks Workflows / Jobs |
| `agents/base.py` runtime | Agent Bricks SDK |
| `agents/llm/client.py` (Anthropic direct) | Foundation Model APIs (Mosaic AI Model Serving) |
| `data/bronze/*.py` ingestion scripts | DLT pipelines (`@dlt.table` + expectations) |
| `data/silver/*.py` transformations | DLT with `@dlt.expect_or_drop` + DQ KQI |
| Postgres pgvector tables | Lakebase OR Delta + Databricks Vector Search (decision in Phase 0 ADR) |
| Local migrations | Databricks SQL setup + Terraform |
| `.env` secrets | Databricks Secrets |
| `infra/terraform/*.tf` reference | Tenant-specific Terraform validated against Prysmian/EY workspace |

## Honest port effort estimate

- **12-15 person-days** to harden the reusable scaffold for a
  Databricks Phase 1 proof-of-architecture. Scope: Agent Bricks port,
  Foundation Model APIs swap, Delta schema migration, basic DLT
  pipelines, prompt redeploy, basic UC governance.
- **4-8 weeks** for a governed Phase 1 MVP. Includes:
  - Source hardening + per-source legal/ToS review (sequential)
  - Databricks workspace + Unity Catalog setup + tenant security
  - Internal Prysmian system integration (SAP, Salesforce)
  - EU AI Act conformity assessment per agent (Articles 9-49)
  - Production CI/CD + observability + monitoring
  - User acceptance + sign-off cycles

This estimate **excludes** the Phase 0 Conformity Sprint
(4-6 weeks separately) per the EY proposal.
