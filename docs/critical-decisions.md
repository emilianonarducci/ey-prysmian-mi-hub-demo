# Critical Decisions

Source: design spec §15. Tracked decisions that must be confirmed
before Phase 1 implementation kickoff. The first table is the
original 18-decision register; the second table captures the actual
values resolved during the 3-day demo build.

## Open decisions (from spec §15)

| # | Decision | Default | Status |
|---|----------|---------|--------|
| Q1 | LLM model ID (primary / fallback) | Claude Sonnet (latest) primary · Claude Haiku fallback · OpenAI GPT-4 if Anthropic unreachable | **TBD** |
| Q2 | Embedding model | `voyage-3-large` (1024-dim) primary · OpenAI `text-embedding-3-large` (1536-dim) fallback | **TBD** |
| Q3 | Vector strategy | pgvector HNSW + cosine; embeddings cached per content hash | Default |
| Q4 | Phase 1 vector store | Lakebase pgvector OR Delta + Databricks Vector Search (decided in Phase 0 ADR) | **TBD Phase 0** |
| Q5 | Anthropic API key + budget | EY-managed; budget $15-25 for 3-day dev + demo | **TBD** |
| Q6 | Demo machine | Personal laptop preferred + pre-booted state · DR: screen recording | **TBD** |
| Q7 | Audience for demo | Prysmian leadership + EY co-watching · tone: confident but honest | Default |
| Q8 | Repo hosting | EY GitHub Italy org; access controlled | **TBD** |
| Q9 | Day 0 prep time | 1-2h before Day 1 (Anthropic account, Docker, Codex CLI, repo init) | Default |
| Q10 | Mining cable demand formula | Placeholder heuristic `MW × typology_km_factor`; Phase 1 uses EY P&U model | Default |
| Q11 | Source ToS verification | Demo: assume compliant for prototype; Phase 0: legal review per source | Default |
| Q12 | Cost monitoring during demo build | Track Anthropic tokens per agent run; budget alert at $20 | Default |
| Q13 | Frontend deployment target Phase 1 | Databricks Apps (decision deferred to Phase 0 ADR) | **TBD Phase 0** |
| Q14 | Secrets management Phase 1 | Databricks Secrets + service principal auth | Default |
| Q15 | Logging / observability for demo | Basic Python logging + uvicorn access logs; no centralized observability | Default |
| Q16 | Human review workflow for agent outputs | None in demo (manual review only); Phase 1 introduces HITL queue | Default |
| Q17 | Acceptance threshold "real" vs "seeded" | UI labels seeded data with "Seed" badge; live refresh adds "Live" badge per record | Default |
| Q18 | Source validation owner in Phase 1 | Prysmian MI&D + EY Legal joint review | **TBD** |

## Decisions resolved during build

| # | Decision | Resolution |
|---|----------|------------|
| Q1 | LLM model | **Primary**: `claude-sonnet-4-6`. **Fallback**: `claude-haiku-4-5`. Both verified working against the Anthropic API during Day 2; agent runs in `audit.agent_runs` show successful completions on the primary model with the fallback path exercised in the LLM client (`agents/llm/client.py`). |
| Q2 | Embedding model | Intent was `voyage-3-large` (1024-dim). `VOYAGE_API_KEY` was **not provisioned** for the demo build, so silver embeddings are skipped and the agent retrieval path falls back to keyword search. The pgvector column and HNSW index remain in place so Phase 1 can simply backfill embeddings. |
| Q5 | Anthropic budget | Actual tokens consumed are queryable via the audit trail: `SELECT SUM(tokens_input + tokens_output) FROM audit.agent_runs;`. Final number is recorded in the Day 3 run-through report; well under the $15-25 budget cap. |
| Q6 | Demo machine | Local laptop confirmed working; the full stack runs on Docker Desktop with frontend at `localhost:3015` and API at `localhost:8000`. Postgres bound to host port `5436` to avoid conflicts with other dev containers. |
| Q12 | Cost monitoring | Each agent invocation writes `tokens_input` and `tokens_output` to `audit.agent_runs`. The single query above gives a running total without external dashboarding. |
| Q17 | Seed vs live labelling | Implemented as `data_source_label` column in `gold.mining_projects` and `gold.news_curated` with values `seed` or `live`; the frontend renders a colored badge per row. |

## Build-time caveat — `commodity_indicators`

The seed loader uses `ON CONFLICT DO NOTHING` against the natural
key of `gold.commodity_indicators`. If the seed timestamp for a given
commodity collides with the "today's latest" row produced by a fresh
agent run, the live row is **skipped silently** rather than
overwriting the seed. This is acceptable for the demo (charts still
render from the seeded history) but Phase 1 must replace this with a
proper upsert keyed on `(commodity, observation_date)` so live data
takes precedence.
