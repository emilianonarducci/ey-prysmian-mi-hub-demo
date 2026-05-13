# ADR-006: Evidence metadata schema — safer audit fields, no raw chain-of-thought

Status: Accepted · Date: 2026-04-30

## Context

EY proposal language referenced an "audit-grade reasoning trace" for
every agent output. External Codex review flagged this as both
**risky** (storing generated reasoning has governance and legal
implications) and **technically fragile** (most commercial LLM APIs
do not reliably expose raw hidden chain-of-thought; what is exposed
is best-effort post-hoc rationalization, not the actual decision
process). We need an audit story that anticipates EU AI Act Article
12 record-keeping requirements without overclaiming.

## Decision

Persist a safer evidence bundle per agent invocation in
`audit.evidence_metadata`:

- `run_id` (UUID, primary key)
- `agent_name`, `agent_version`
- `prompt_version` — Git SHA + prompt filename, so the exact prompt
  text at execution time is reproducible
- `model_id` — e.g. `claude-sonnet-4-6`
- `source_urls[]` — every URL the agent consulted
- `source_snapshots_hash[]` — SHA-256 of fetched content at fetch
  time; the **reproducibility anchor**
- `tool_calls[]` — `{tool_name, input, output}` per call
- `retrieved_context[]` — RAG hits with similarity scores (if used)
- `structured_output` — Pydantic-validated final output (the same
  object written to gold)
- `validation_checks` — which validators / DQ checks passed
- `confidence_summary` — plain-prose self-rating, explicitly **not**
  hidden chain-of-thought
- `started_at`, `completed_at`, `latency_ms`, `tokens_used`

We **deliberately do not** store raw model reasoning. The demo
narrator must use the phrase "traceability pattern that anticipates
EU AI Act Article 12" — not "audit-grade" or "EU AI Act ready".

The Mining Specialist's `estimate_cable_demand_mining` heuristic
(`MW × typology_km_factor`) is a documented **placeholder** here.
Factor values live in `agents/tools/cable_demand.py` and are
explicitly NOT Prysmian commercial estimates. Phase 1 replaces this
with the EY Power & Utilities sector model.

## Alternatives considered

- **Store everything the API returns including any reasoning blocks**
  — rejected; legal and governance risk; many APIs don't reliably
  expose it; storing generated text as if it were the model's
  cognition invites misinterpretation.
- **Store only `structured_output`** — too thin for audit; loses
  source snapshot hashes and tool call traces.
- **Use a third-party observability tool (Helicone, Langfuse)** —
  adds another vendor; redirects Phase 1 conversation away from
  Unity Catalog audit tables which is where the artifacts should
  ultimately live.

## Consequences

Positive:
- Every gold row is traceable back to source URLs **and** content
  snapshot hashes, so we can prove what the agent saw, not just what
  it returned.
- The schema maps directly to a Unity Catalog `audit` table in
  Phase 1.
- Honest framing avoids overclaim risk (R18).

Negative:
- "We cannot show you the model's reasoning" must be explained to
  reviewers who expect a chain-of-thought viewer; the demo script
  addresses this explicitly.

## References

- Design spec §5.3, §13, §14 (demo script line "[03:10]"), R18.
- `data/migrations/005_audit.sql`, `backend/db/repositories/evidence_metadata.py`.
