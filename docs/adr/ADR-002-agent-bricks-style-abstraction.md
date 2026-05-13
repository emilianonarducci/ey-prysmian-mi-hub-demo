# ADR-002: Agent Bricks-style abstraction (local `BaseAgent`)

Status: Accepted · Date: 2026-04-30

## Context

The Prysmian Phase 1 target runtime is Databricks **Agent Bricks**
(Mosaic AI Agent Framework). For the demo we need a local Python
implementation that produces real agent runs against Claude, but we
must avoid lock-in to a local idiom that would have to be entirely
rethought when porting.

## Decision

Implement an abstract `BaseAgent` class in `agents/base.py` whose
method signatures, lifecycle, and IO patterns mirror what Agent
Bricks expects:

- Pydantic IO schemas declared up front.
- A `run(bounded, max_items, timeout_s)` entry point that returns a
  `RunResult` containing `status` (`success`, `fallback_used`,
  `failed`), structured output, and evidence metadata.
- Tools registered as plain Python callables with explicit input /
  output Pydantic models — the same shape Agent Bricks `@tool`
  decorators expect.
- Single writeback path through a repository that persists both gold
  output and `audit.evidence_metadata` in the same transaction.

Concrete agents `NewsFinderAgent` and `MiningCableSpecialistAgent`
inherit from `BaseAgent`.

## Alternatives considered

- **LangChain / LangGraph** — heavy framework, opinionated abstractions
  that do not map 1:1 to Agent Bricks; would create a second porting
  step.
- **Anthropic SDK directly with no abstraction** — would work for the
  demo but signals nothing about the Phase 1 architecture; reviewers
  would have to imagine the shape of the port.
- **DSPy** — interesting but research-coded; too much surface area to
  introduce alongside a 3-day delivery.

## Consequences

Positive:
- Phase 1 port becomes mechanical: method **bodies** are rewritten
  against the Agent Bricks SDK, schemas and prompts are copied.
- The Pydantic schemas in `agents/` are an explicit data contract
  that survives the port.

Negative:
- `BaseAgent` is **not** itself reusable code — it is a stand-in for
  Agent Bricks, deliberately discardable.
- A small risk of API drift: if Agent Bricks SDK changes between now
  and Phase 1, the signature mimicry may need updating.

## References

- Design spec §5.3, §7.3, §11.
- `agents/base.py`, `agents/news_finder.py`,
  `agents/mining_cable_specialist.py`.
