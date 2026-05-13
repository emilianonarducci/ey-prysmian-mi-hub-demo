# Architecture — Prysmian MI Hub Demo

**Status**: Phase 0 deliverable · Demo scaffold (not Phase 1 production)
**Date**: 2026-04-30 · **Revision**: Day 3 build

This document condenses sections §4-§6 of the design spec
(`2026-04-30-prysmian-mi-hub-demo-design.md`) into a developer-facing
reference.

---

## 1. Service Topology

A four-service Docker Compose stack, runnable from a single laptop:

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER  (Prysmian / EY demo)                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ localhost:3015
┌────────────────────────────┴─────────────────────────────────────┐
│  frontend  (node:20-alpine + Vite)                               │
│  React 18 + TS + Tailwind + shadcn/ui + Recharts + React Query   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ localhost:8000
┌────────────────────────────┴─────────────────────────────────────┐
│  api  (python:3.11-slim + FastAPI + uvicorn)                     │
│  Routes: /projects · /trends · /countries · /news · /agents/run  │
└─┬─────────────────────────────────────────────────┬──────────────┘
  │ SQLAlchemy                                       │ BackgroundTasks
  ▼                                                  ▼
┌────────────────────────┐  ┌──────────────────────────────────────┐
│  postgres              │  │  agent-worker                         │
│  pgvector/pgvector:pg16│  │  (python:3.11-slim)                   │
│  bronze/silver/gold/   │  │  · BaseAgent abstraction              │
│  audit schemas         │  │  · NewsFinderAgent                    │
│                        │  │  · MiningCableSpecialistAgent         │
└────────────────────────┘  └──────────────────────────────────────┘
                                       │
                                       ▼
                            ┌────────────────────────┐
                            │  EXTERNAL APIs          │
                            │  · Anthropic Claude     │
                            │  · mining.com RSS       │
                            │  · EuropaCable RSS      │
                            │  · Westmetall CSV       │
                            └────────────────────────┘
```

Host ports during demo: frontend `3015`, API `8000`, Postgres `5436`
(non-default to avoid conflicts on the developer laptop).

## 2. Service Responsibilities

| Service        | Image                    | Port | Responsibility |
|----------------|--------------------------|------|----------------|
| `frontend`     | node:20-alpine           | 3015 | React UI dev server (Vite + HMR) |
| `api`          | python:3.11-slim         | 8000 | FastAPI: JSON endpoints + agent dispatch |
| `postgres`     | pgvector/pgvector:pg16   | 5436 | Persistent data + vector embeddings |
| `agent-worker` | python:3.11-slim         | —    | Background agent execution (apscheduler in demo) |

## 3. Cache-First Demo Strategy

The demo cannot fail due to external sources being slow or unreachable:

- Bronze and Silver tables are seeded with deterministic data at first
  boot via `make seed`.
- Gold tables are pre-populated with results from prior agent runs
  (committed in `data/bronze/seed/gold_seed.json`).
- The Refresh button triggers a **bounded** live agent run: max 2-3
  fresh items, 30-60s timeout, automatic fallback to seed if the
  external source or LLM is unreachable.
- Every UI record carries a `data_source_label` (`seed` or `live`) so
  the demo narrator can clearly distinguish seeded baseline from live
  refresh output.

## 4. Data Flow

```
External sources (RSS, CSV, public APIs)
  ↓ (bronze ingestion — idempotent, hash-dedup, ToS-aware)
postgres BRONZE schema (raw, append-only)
  ↓ (silver transformations — schema validation, normalization, embedding)
postgres SILVER schema
  ↓ (agent execution — bounded run with retries + fallback to seed)
postgres GOLD schema + AUDIT schema (evidence bundle metadata)
  ↓ (FastAPI repositories)
React UI
```

## 5. Component Detail

### Frontend
- React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Recharts +
  React Router 6 + TanStack Query + axios.
- Five views: Landing · Country ID · Market Trends · News & Reports ·
  Project List.
- Reusable components: `<AIInsightCard>`, `<ProjectTable>`,
  `<ProjectFilters>`, `<TrendChart>`, `<EvidenceMetadataViewer>`.

### Backend API
- FastAPI + SQLAlchemy 2.0 + Pydantic 2 + uvicorn.
- Repository-per-resource pattern (`ProjectsGoldRepository`,
  `NewsGoldRepository`, `TrendsGoldRepository`,
  `EvidenceMetadataRepository`).
- Endpoints: `/api/projects`, `/api/projects/{id}`, `/api/news`,
  `/api/trends/{country}`, `/api/countries`,
  `/api/countries/{id}/summary`, `/api/agents/{name}/run`,
  `/api/agents/runs`, `/api/health`.

### Agents
- `BaseAgent` Python class with method signatures that mimic the
  Databricks Agent Bricks SDK — the concept transfers; the runtime
  implementation is rewritten in Phase 1 (see ADR-002).
- `NewsFinderAgent` — generic newsletter curation across cable /
  energy / utility / telecom feeds.
- `MiningCableSpecialistAgent` — mining project + commodity
  extraction.
- LLM client: Anthropic Claude (Sonnet primary, Haiku fallback);
  embeddings via Voyage (or keyword fallback if no key).
- Scheduling: `apscheduler` in `agent-worker` for demo only; replaced
  by Databricks Workflows in Phase 1.

## 6. Evidence Metadata Schema (safer fields)

Stored in `audit.evidence_metadata`. Deliberately **no raw
chain-of-thought** — most commercial APIs don't expose it reliably and
storing generated reasoning has governance/legal risk.

Fields:
- `run_id` (UUID)
- `agent_name`, `agent_version`
- `prompt_version` (git SHA + filename)
- `model_id`
- `source_urls[]`
- `source_snapshots_hash[]` (SHA-256 of content at fetch time — the
  reproducibility anchor)
- `tool_calls[]`
- `retrieved_context[]`
- `structured_output` (Pydantic-validated final output)
- `validation_checks`
- `confidence_summary` (plain-prose self-rating, **not** CoT)
- `started_at`, `completed_at`, `latency_ms`, `tokens_used`

This is a **traceability pattern** that anticipates EU AI Act Article
12 (record-keeping) requirements; it is **not** a formal conformity
claim.

## 7. BaseAgent Abstraction

`agents/base.py` defines a `BaseAgent` class with method signatures
chosen for parallel portability to Databricks Agent Bricks. Each
concrete agent:

1. Declares its tools (Python functions + Pydantic IO schemas).
2. Implements `run(bounded: bool, max_items: int, timeout_s: int)`.
3. Writes structured output to `gold.*` and metadata to
   `audit.evidence_metadata` via a single repository call.
4. Returns a status of `success`, `fallback_used`, or `failed`.

Phase 1 port: method bodies are rewritten against Agent Bricks SDK;
schemas and prompts are reused verbatim.

## 8. Infrastructure

- **Local**: `docker-compose.yml`, internal network, named volumes.
- **Phase 1 IaC** (reference skeletons in `infra/terraform/`):
  `workspace.tf`, `unity_catalog.tf`, `lakebase.tf`,
  `model_serving.tf`, `workflows.tf` — **not apply-ready**; see
  `infra/terraform/README.md`.
