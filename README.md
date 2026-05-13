# EY Prysmian Marketing Intelligence Hub — Demo

Production-aligned scaffold demonstrating the proposed Databricks architecture for Prysmian's Marketing Intelligence Hub.

## What it does

A cache-first local demo with:
- **5 navigable views** mirroring the client mockup (Landing · Country ID · Market Trends · News & Reports · Project List)
- **2 always-on AI agents** matching the client clarification email:
  - **News Finder** (generic) — curates newsletter from cable/energy/telecom RSS feeds
  - **Mining Cable Specialist** — extracts mining projects + tracks copper commodity
- **Evidence metadata** for every agent output (audit-grade traceability pattern)
- **Production scaffolder**: project structure, prompts, schemas, ADRs reusable for Phase 1 Databricks port

## Quick start

```bash
cp .env.example .env
# Edit .env to add ANTHROPIC_API_KEY (rotate after demo!)
make up        # boots 4 services (frontend, api, postgres, agent-worker)
make seed      # populates gold tables with deterministic demo data
open http://localhost:3000
```

Optional: trigger live agent runs (bounded, with timeout + fallback):

```bash
make agent-news
make agent-mining
```

## Honest framing

This is a **production-aligned scaffold**, not a finished product. The reusable assets (project structure, prompts, schemas, source catalog, UI patterns, ADRs) accelerate the Databricks Phase 1 implementation. The runtime (Postgres → Lakebase/Delta, FastAPI/Docker → Databricks Apps, APScheduler → Databricks Workflows, Anthropic direct → Foundation Model APIs) is rewritten, not ported.

Estimated effort from demo end to Phase 1 MVP: **12-15 person-days** to harden the scaffold for Databricks + **4-8 weeks** for a governed MVP (subject to source access, internal data integration, EU AI Act conformity assessment).

## Docs

- [`docs/architecture.md`](docs/architecture.md) — technical architecture
- [`docs/demo-script.md`](docs/demo-script.md) — ~4 min demo walkthrough
- [`docs/scaffolder-map.md`](docs/scaffolder-map.md) — local → Databricks porting map
- [`docs/data-sources.md`](docs/data-sources.md) — 30+ approved sources from client email
- [`docs/critical-decisions.md`](docs/critical-decisions.md) — decisions tracked during build
- [`docs/adr/`](docs/adr/) — 7 Architecture Decision Records

## Tech stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Recharts + TanStack Query
- **Backend**: FastAPI + SQLAlchemy 2.0 + Pydantic 2
- **Database**: Postgres 16 with pgvector extension
- **Agents**: Anthropic Claude API (Sonnet primary, Haiku fallback) + Voyage embeddings
- **Orchestration**: Docker compose locally; Databricks Workflows in production

See [`docs/adr/ADR-001-stack-react-fastapi.md`](docs/adr/ADR-001-stack-react-fastapi.md) for rationale.

## License & confidentiality

Confidential — EY internal use for Prysmian engagement.
