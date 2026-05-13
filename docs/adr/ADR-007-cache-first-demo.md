# ADR-007: Cache-first demo strategy — seeded gold + bounded live refresh + fallback

Status: Accepted · Date: 2026-04-30

## Context

A live executive demo cannot fail because mining.com's RSS feed is
slow, Westmetall's CSV format changed, or Anthropic returns a rate
limit. At the same time, a demo that is **only** seed data feels
canned and fails to validate the agent pattern. We need a strategy
that combines reproducibility with credible live behavior.

## Decision

Three layers, in order of preference at demo time:

1. **Seeded gold tables** — `data/bronze/seed/gold_seed.json` is
   loaded by `scripts/seed_demo_data.py`. Every UI view renders
   correctly from seed alone with zero external network access. Each
   seed row is tagged `data_source_label = 'seed'` and shown with a
   "Seed sample" badge.

2. **Bounded live refresh** — the "Refresh" button on News & Reports
   and Project List triggers an agent run with explicit bounds:
   - `max_items` = 2-5 fresh items per run
   - `timeout_s` = 30 (news) / 60 (mining specialist)
   - All fetches use per-source rate limits and timeouts
   - New rows are tagged `data_source_label = 'live'` so they are
     visually distinct from seed rows.

3. **Graceful fallback** — if any external source is unreachable or
   the LLM call fails after retry, the agent returns
   `status = "fallback_used"` and the UI shows a banner
   ("Live source unavailable — showing latest seeded sample"). The
   demo continues without error.

Acceptance contract: an agent run **never returns `failed`** during a
demo; only `success` or `fallback_used`.

## Alternatives considered

- **Fully live** — too fragile; one outage breaks the demo.
- **Fully canned (pre-recorded screen capture)** — defeats the
  agent-as-real-thing message.
- **Long-running pre-warm only** — does not exercise the live path
  during the demo itself, so reviewers cannot see the agent run.

## Consequences

Positive:
- Demo is deterministic and resilient; an external outage is
  invisible to the audience.
- The live refresh is the moment that proves the agent pattern works.
- The seed / live badge mechanic doubles as the data-provenance story
  for the UI.

Negative:
- The "live" data is bounded and small (~5 items per run) so reviewers
  see only a handful of fresh items in real time; documented in the
  demo script.
- Seed data must be kept current enough to be believable — addressed
  by re-running both agents periodically and committing fresh gold
  seed snapshots when feature work touches schemas.

## References

- Design spec §4.3, §10 Day 2 fallbacks, §13.
- `scripts/seed_demo_data.py`, `agents/base.py` (RunResult status enum).
