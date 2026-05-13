# ADR-005: Claude via Anthropic direct (demo) · Foundation Model APIs (Phase 1)

Status: Accepted · Date: 2026-04-30

## Context

The agents need a high-quality LLM with reliable structured-output
support. Phase 1 will route LLM traffic through **Databricks
Foundation Model APIs / Mosaic AI Model Serving** for governance,
billing centralization, and EU data residency. The demo runs outside
Databricks and therefore cannot use FM APIs.

## Decision

- **Demo**: call Anthropic's hosted API directly via the official
  `anthropic` Python SDK.
- **Primary model**: `claude-sonnet-4-6` (verified during Day 2
  build).
- **Fallback model**: `claude-haiku-4-5` (used when the primary
  returns an overload / rate-limit error; configured in
  `agents/llm/client.py`).
- **Phase 1**: route the identical request shapes through Foundation
  Model APIs. The `agents/llm/client.py` wrapper is the single
  swap-point; agent code consumes a stable internal interface
  (`generate`, `generate_structured`, `tool_use_loop`).
- Token usage is logged per invocation into `audit.agent_runs`
  (`tokens_input`, `tokens_output`, `latency_ms`) so cost is
  observable without an external dashboard.

## Alternatives considered

- **Mock the LLM entirely with canned responses** — would forfeit
  G4 (real bounded agent runs) and the live-refresh demo moment.
- **OpenAI GPT-4 as primary** — Anthropic is the EY house default
  and the Claude tool-use loop is well-suited to the structured
  extraction the Mining Specialist needs. OpenAI retained as a
  tertiary failsafe in spec §15 Q1.
- **Self-hosted open-source model** — wholly out of scope for 3 days
  of build time.

## Consequences

Positive:
- Real LLM behavior in the demo; reviewers see actual structured
  extraction from public articles.
- Single file (`agents/llm/client.py`) is the entire surface area
  that changes when migrating to FM APIs.
- Per-run token accounting flows through `audit.agent_runs` and is
  reused in Phase 1 cost dashboards.

Negative:
- Anthropic API outages or rate limits could break a live demo —
  mitigated by the cache-first strategy in ADR-007.
- API key is stored in `.env` for the demo; Phase 1 uses Databricks
  Secrets (spec §15 Q14).

## References

- Design spec §5.3, §15 Q1, §15 Q5, §15 Q12.
- `agents/llm/client.py`.
