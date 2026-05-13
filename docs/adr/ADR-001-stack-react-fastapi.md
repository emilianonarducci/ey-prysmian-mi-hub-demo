# ADR-001: Stack — React/Vite + FastAPI + Postgres pgvector + Docker Compose

Status: Accepted · Date: 2026-04-30

## Context

A 3-day demo must boot on a single laptop, render five UI views,
expose a JSON API, run two LLM agents, and persist evidence metadata.
The stack must be productive for a small team in three days **and**
its conceptual artifacts (schemas, prompts, UI components) must port
cleanly to Databricks for Phase 1.

## Decision

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
  + Recharts + React Router 6 + TanStack Query.
- **Backend**: FastAPI + SQLAlchemy 2.0 + Pydantic 2 + uvicorn on
  Python 3.11.
- **Database**: `pgvector/pgvector:pg16` — Postgres 16 with the
  pgvector extension for the silver embedding column.
- **Local orchestration**: Docker Compose with four services
  (frontend, api, postgres, agent-worker) on a single user-defined
  bridge network with named volumes.

## Alternatives considered

- **Next.js** instead of Vite + React Router — heavier; SSR features
  unnecessary for an internal demo; Vite HMR is faster for iteration.
- **Streamlit / Gradio** — would have shaved a day off the frontend
  but cannot reproduce the bespoke mockup styling (4-quadrant Country
  ID dashboard, Project Pipeline bar chart, AI Insight Cards).
- **Flask** instead of FastAPI — less type-safety; no first-class
  Pydantic integration; OpenAPI generation worse for a Phase 1
  client codegen play.
- **SQLite** instead of Postgres — no pgvector; cannot prototype the
  vector retrieval pattern that anchors the Phase 1 Lakebase /
  Vector Search decision (ADR-003).
- **Kubernetes / Helm** — orders of magnitude more setup than Docker
  Compose can absorb in 3 days.

## Consequences

Positive:
- One-command boot (`docker compose up`) on any developer laptop.
- Pydantic schemas double as both API contracts and agent IO
  contracts — the same files transfer to Phase 1.
- pgvector exercises the same conceptual retrieval pattern as
  Databricks Vector Search.
- React component code is portable to Databricks Apps almost
  verbatim.

Negative:
- The runtime is **not** the Phase 1 runtime — FastAPI, Docker, and
  apscheduler must be replaced. Scaffolder map (ADR-002, ADR-005)
  documents the porting effort.
- Postgres host port had to be remapped (`5432 → 5436`) on the demo
  laptop due to existing dev containers.

## References

- Design spec §4.1 (service topology), §5 (components), §11
  (scaffolder map).
- `docker-compose.yml`, `frontend/package.json`, `backend/main.py`.
