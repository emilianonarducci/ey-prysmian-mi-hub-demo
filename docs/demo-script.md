# Demo Script — ~4 min (cache-first walkthrough)

Copied verbatim from design spec §14 — minor port-number adjustments
reflect the actual demo build (frontend on `:3015`, not `:3000`).

```
[00:00] "I'll show you a working prototype. It runs locally — Postgres
        with pgvector, two AI agents using Anthropic's Claude API.
        It's cache-first by design: the demo data is reproducible
        and the live agent calls are bounded with fallbacks, so the
        demo doesn't break if external sources or the LLM are slow.

        Important: this is a production-aligned scaffold, not the
        Phase 1 codebase. The reusable assets — prompts, schemas,
        source catalog, UI patterns, ADRs — accelerate Phase 1.
        The runtime is rewritten for Databricks (Postgres → Lakebase
        or Delta; FastAPI/Docker → Databricks Apps; APScheduler →
        Databricks Workflows). Honest porting estimate: 12-15
        person-days to a Databricks proof-of-architecture, plus
        4-8 weeks for a governed Phase 1 MVP."

[00:45] LANDING — Europe map, 4 KPI cards, click Italy

[01:00] COUNTRY ID — stub view with seed data (labeled "Seed sample").
        "In Phase 1 this is wired to SAP + Salesforce; here it's
        seed data for layout demonstration."

[01:20] NEWS & REPORTS — live newsletter feed. "These articles
        came from mining.com, EuropaCable, IEA, DCD News Europe —
        the generic sources from your email. Click 'Refresh' for
        a bounded agent run."

[01:50] Click Refresh — agent runs (bounded: 5 articles max, 30s
        timeout). New article appears. "If the source had been
        unreachable, we'd have seen a graceful fallback message."

[02:20] MARKET TRENDS — 6 charts. "Copper is live LME data from
        Westmetall. The AI Insight box is a narrative summary
        from the Mining Cable Specialist agent."

[02:50] PROJECT LIST — "Mining Cable Specialist extracts mining
        projects from mining.com articles. Click a project."

[03:10] EVIDENCE METADATA modal opens. "Every project has audit
        metadata: source URL, source snapshot hash, prompt version,
        model ID, tool calls, structured output, validation checks,
        timestamp. We deliberately do not store raw model reasoning —
        that's a governance hazard. This is a traceability pattern
        that anticipates EU AI Act Article 12 requirements, not
        a formal conformity claim."

[03:40] REPO STRUCTURE briefly:
        "infra/terraform — reference skeletons, not apply-ready.
         agents/base.py — Agent Bricks-style abstraction.
         data/bronze/sources_catalog.yaml — 30+ sources from your
         email catalogued for Phase 1 backlog.
         docs/adr — 7 Architecture Decision Records."

[04:00] "Honest summary: this demo proves the architecture,
        validates the agent pattern, and produces reusable assets
        that accelerate Phase 1. It is not a finished product —
        Phase 0 Conformity Sprint and Phase 1 MVP each address
        what this demo deliberately does not: governance, security,
        internal data integration, source legal review, production
        observability, audit-grade controls."

        Q&A
```

## Pre-demo checklist (5 min before)
- `docker compose ps` — all four services healthy
- `curl -sf http://localhost:8000/api/health` → `200`
- Browser tab pre-loaded on `http://localhost:3015`
- `make agent-news` and `make agent-mining` already run once today
  (so gold tables have both `seed` and `live` rows visible)
- Screen recording backup available (see Step 8 of Task 3.5)
