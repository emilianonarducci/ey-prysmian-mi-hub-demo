---
title: "Market Intelligence Hub — Functional Analysis"
subtitle: "Calculation logic, output production rules, data flow, API surface"
author: "EY for Prysmian Group"
date: "May 2026"
toc: true
toc-depth: 3
---

# 1. Document purpose & audience

This document is the **functional analysis companion** to the user manual. Where the user manual answers *"what do I do here?"*, this document answers:

- *How is this number calculated?*
- *Where does this output come from?*
- *What logic produces this insight?*
- *What rules drive this state transition?*
- *What data flows where, and why?*
- *What is the API contract behind each screen?*
- *What are the acceptance criteria, performance characteristics, failure modes?*

**Target audience:**

- MI team / business analysts validating logic
- Solution architects sizing Phase 1
- EY consultants reviewing design choices
- Audit/compliance reviewing AI traceability (EU AI Act)
- Phase 1 implementers needing the exact specs
- Procurement / vendor evaluators

Every formula, ranking rule, taxonomy, state machine, confidence formula, API endpoint and acceptance criterion is documented here. **Each section pairs the functional logic with a UI screenshot of the affected screen**, so the analyst can map *what the user sees* to *what the system does*.

---

# 2. Architectural foundation

## 2.1 The medallion data flow

The Hub uses a **medallion architecture** (Bronze → Silver → Gold) inspired by Databricks lakehouse patterns, plus a dedicated `audit` schema for AI traceability and a runtime layer for HITL state.

```
   ┌─────────┐    ┌──────────┐    ┌──────┐    ┌──────────┐
   │ Bronze  │──▶ │ Silver   │──▶ │ Gold │──▶ │ MI Hub   │
   │ raw     │    │ cleaned  │    │ ready│    │ outputs  │
   └─────────┘    └──────────┘    └──────┘    └──────────┘
                                                    ▲
                       ┌─────────┐                  │
                       │ Audit   │ ◀────────────────┘
                       │ trail   │   every AI write logs here
                       └─────────┘
                       ┌─────────┐
                       │ Runtime │   review decisions,
                       │ state   │   alert read-flags, subscriptions
                       └─────────┘
```

| Schema  | Purpose                                                                        | Update cadence            |
|---------|--------------------------------------------------------------------------------|---------------------------|
| bronze  | Raw ingestion — CSV seeds, HTTP fetches, API pulls, SAP/Salesforce exports     | continuous (agent runs)   |
| silver  | Normalized, deduplicated, schema-validated, embeddings computed                | derived from bronze       |
| gold    | UI-ready aggregates with derived fields (relevance score, flagged, country tags)| derived from silver       |
| audit   | Every agent run, every AI prompt+response, every decision, every confidence    | append-only, immutable    |
| runtime | Mutable per-user state (review decisions, alert read flags, subscriptions)     | per-user actions          |

In the demo all schemas live in a single Postgres 16 instance with pgvector. In Phase 1 this maps to Databricks / Snowflake equivalents with the same boundary semantics.

## 2.2 The end-to-end loop (from the brief)

```
Ingestion  →  Normalize/Enrich -- AI  →  Hub Storage
   ↑                                          ↓
   │                                  Search / UI / API
   │                                          ↓
   │                              Outputs & Dashboards -- AI
   │                                          ↓
   └─────  Feedback loop (HITL early phases)  ◀
```

Every box is reflected in the platform:

| Stage              | Implementation in this build                                    |
|--------------------|------------------------------------------------------------------|
| Ingestion          | seed CSVs (bronze) + News Finder agent (HTTP) + Project Scouting |
| Normalize/Enrich   | AI extraction → silver (relevance score, country tags, segments) |
| Hub Storage        | Postgres gold tables + Review Queue state                        |
| Search/UI/API      | FastAPI + Vite SPA + /api/search global endpoint                 |
| Outputs/Dashboards | Country ID, Trends, Compare, Project detail, AI insight cards    |
| Feedback loop      | Review Queue accept/edit/reject + feedback textarea              |

## 2.3 Process-level architecture

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Frontend    │   │   Backend    │   │   Workers    │
│  (Vite SPA)  │──▶│   (FastAPI)  │──▶│  (Agents)    │
│  served by   │   │   uvicorn 2× │   │ Anthropic SDK │
│  nginx       │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
                          │                  │
                          ▼                  ▼
                   ┌─────────────────────────────┐
                   │       Postgres 16 +         │
                   │       pgvector              │
                   └─────────────────────────────┘
```

In Phase 1 the worker process splits into a scheduled job runner (Airflow / Prefect / Render cron) and an event-driven stream consumer (Kafka / Kinesis / Pub/Sub).

---

# 3. Authentication & session model

![Login screen](manual-screenshots/01-login.jpg)

## 3.1 Demo auth (current build)

- Login uses `sessionStorage` to persist the user email after submit
- Any non-empty email + password is accepted
- The `RequireAuth` React component reads `sessionStorage.mi_hub_user` and redirects to `/login` if absent
- Session ends on browser tab close (sessionStorage behavior)

This is **demo-only scaffolding**. No password validation, no token rotation, no rate limiting. The login screen explicitly states this.

## 3.2 Phase 1 auth model

| Property              | Phase 1 spec                                                  |
|-----------------------|---------------------------------------------------------------|
| Identity provider     | Azure Entra ID (Microsoft Entra)                              |
| Protocol              | OpenID Connect (OIDC) authorization code flow with PKCE       |
| Session storage       | Encrypted HTTP-only cookies (SameSite=Lax)                    |
| Token lifetime        | Access token 1h, refresh token 24h                            |
| MFA                   | Required by Prysmian IT policy (managed at IdP)               |
| User attributes       | email, name, BU, country, role (claims propagated from Entra) |
| Logout                | Local cookie clear + Entra `end_session_endpoint` redirect    |

User → role mapping comes from Entra group membership (`group:mi-team-lead` → role MI lead, etc).

## 3.3 RBAC matrix

| Role             | Hub read | Review queue | Agent config | Subscriptions own/others | RBAC mgmt |
|------------------|----------|--------------|--------------|--------------------------|-----------|
| Viewer           | ✅       | —            | —            | own ✅ / others —       | —         |
| Country viewer   | ✅ (scoped) | —          | —            | own ✅ / others —       | —         |
| MI analyst       | ✅       | ✅ act       | run agents   | own ✅ / others —       | —         |
| MI lead          | ✅       | ✅ act       | config + taxonomy | own ✅ / team ✅   | —         |
| Admin            | ✅       | ✅           | ✅           | ✅                       | ✅        |

## 3.4 Acceptance criteria — auth

| AC-ID  | Criterion                                                                                  |
|--------|--------------------------------------------------------------------------------------------|
| AUTH-1 | Demo: any non-empty `email@x` + non-empty password lands on `/`                            |
| AUTH-2 | Demo: unauthenticated access to `/`, `/review`, etc. redirects to `/login`                 |
| AUTH-3 | Demo: closing tab clears session                                                           |
| AUTH-4 | Phase 1: invalid Entra token → 401 with `WWW-Authenticate: Bearer` header                  |
| AUTH-5 | Phase 1: user without `mi_team` role accessing `/api/review/{id}/decide` → 403            |

---

# 4. Dashboard — every block, mapped to its logic

![Dashboard](manual-screenshots/02-dashboard.jpg)

The Dashboard is a **read-only aggregator** — no writes happen here. Each block has a precise data source and rendering rule.

## 4.1 Hero greeting (top card)

| Element                  | Logic                                                                                 |
|--------------------------|---------------------------------------------------------------------------------------|
| Greeting text            | `f"Good {tod}, {firstName}"` where `tod ∈ {morning|afternoon|evening|night}` by hour |
| "Live · AI agents active" badge | Static visual signal (no real ping in demo, would be live in Phase 1)          |
| "Today's market brief" CTA      | Links to `/trends`                                                              |
| "Mining pipeline" CTA           | Links to `/projects`                                                            |
| Background image                | `/mockup-reference/image1.jpg`, opacity 25%, screen blend                       |

## 4.2 Today's AI Brief

A *templated* natural-language paragraph generated from live aggregates:

```python
def generate_brief(projectsTotal, newsCount, draftsCount, highAlerts, flaggedCount):
    parts = [
      f"AI agents have surfaced {newsCount} news items and "
      f"{projectsTotal} mining/grid projects in the last cycle"
    ]
    if flaggedCount > 0: parts.append(f"{flaggedCount} flagged of strategic interest")
    if draftsCount > 0:  parts.append(f"{draftsCount} drafts awaiting MI team validation")
    if highAlerts > 0:   parts.append(f"{highAlerts} high-severity alerts triggered")
    parts.append("copper momentum sustained on supply tightening, EU permits trending mixed")
    return " · ".join(parts) + "."
```

| Aggregate          | Source endpoint                                            |
|--------------------|------------------------------------------------------------|
| `projectsTotal`    | `/api/projects` → `total`                                  |
| `newsCount`        | `/api/news` → length                                       |
| `draftsCount`      | `/api/review/stats` → `by_status.draft`                    |
| `highAlerts`       | `/api/alerts/stats` → `by_severity.high`                   |
| `flaggedCount`     | computed client-side from projects with `flagged_of_interest=true` |

**Why templated, not LLM-generated?** Determinism and audit safety. The numbers are *provably* the same as those shown elsewhere on the page (same query, same render). In Phase 1, an LLM can wrap stylistic variety around this skeleton, but the numbers stay deterministic.

The three chip-links are quick navigation:

- `{draftsCount} drafts to review` → `/review`
- `{highAlerts} high-severity alerts` → `/alerts`
- `2 agents active` → `/agents` (count is currently static — Phase 1 reads it from `/api/agents/catalog`)

## 4.3 KPI strip (4 tiles)

| Tile               | Formula                                       | Delta logic                       |
|--------------------|-----------------------------------------------|-----------------------------------|
| Mining projects    | `count(gold.mining_projects)`                  | demo: hardcoded +8%; Phase 1: vs same period prior quarter |
| News tracked (30d) | `count(gold.news_curated WHERE curated_at >= now - 30d)` | demo: hardcoded +12%; Phase 1: vs prior 30d |
| Countries covered  | `count(distinct country)`                      | static "5"                         |
| AI confidence      | `avg(audit.evidence_metadata.confidence_score)`| demo: 92%; Phase 1: rolling 7d avg |

Delta arrow + color is purely a function of sign:

```typescript
trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat"
chipClass = trend == "up" ? green : trend == "down" ? red : neutral
```

## 4.4 Latest intelligence feed (left)

```sql
SELECT * FROM gold.news_curated
ORDER BY published_at DESC NULLS LAST, curated_at DESC
LIMIT 5;
```

Per-row rendering:

| Element        | Source                                                                |
|----------------|-----------------------------------------------------------------------|
| Source label   | `n.source`                                                            |
| Country chips  | `n.countries.slice(0, 2)`                                             |
| Relative time  | `relTime(n.published_at)` — see §22.1                                 |
| Title (2 lines)| `n.title`                                                             |
| Summary (2 lines)| `n.summary`                                                         |
| Click behavior | `window.open(n.url, '_blank')`                                        |

## 4.5 Flagged projects (right)

```sql
SELECT * FROM gold.mining_projects
WHERE flagged_of_interest = true
ORDER BY capex_estimate_musd DESC NULLS LAST
LIMIT 4;
```

Per-row: building icon + name + `{country} · {status}` + CAPEX in `$XXXM` format.

## 4.6 EU AI Act compliance card

Static info card. Reminds the user that every output carries evidence trail + confidence. Click-through to the Evidence bundle viewer is **not** linked here directly (intentional — this is a strategic message, not a function).

## 4.7 Explore cards

4 navigation cards to `/country/italy`, `/trends`, `/news`, `/projects`. Each has:

- Color-coded icon (green / blue / amber / neutral)
- Label
- One-line description
- Hover effect: arrow icon slides in + label turns green

## 4.8 Acceptance criteria — Dashboard

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| DASH-1   | Greeting changes by hour-of-day                                                           |
| DASH-2   | If `draftsCount == 0`, the corresponding clause is omitted from AI Brief                  |
| DASH-3   | KPI strip values match what the destination pages show (no double counting)               |
| DASH-4   | If `news.data` is null, "Latest intelligence" shows "No news available yet."              |
| DASH-5   | Clicking a news row opens `n.url` in a new tab; analytics event `news.open_external` fires (Phase 1) |

---

# 5. Global search (⌘K) — ranking & dispatch

![Search palette](manual-screenshots/03-search-palette.jpg)

## 5.1 Triggering

- Click search bar in header
- Press `⌘K` (Mac) / `Ctrl+K` (Windows/Linux)
- ESC to close
- Background click closes (modal pattern)

## 5.2 Debounce

180ms after the last keystroke before the search query fires. This prevents request spam while typing fast.

```typescript
useEffect(() => {
  const t = setTimeout(() => setDebounced(q), 180);
  return () => clearTimeout(t);
}, [q]);
```

## 5.3 Backend query (current build)

```sql
-- /api/search?q=copper

SELECT * FROM gold.news_curated
WHERE title ILIKE '%copper%' OR summary ILIKE '%copper%'
ORDER BY published_at DESC
LIMIT 8;

SELECT * FROM gold.mining_projects
WHERE name ILIKE '%copper%' OR owner ILIKE '%copper%' OR country ILIKE '%copper%'
LIMIT 8;

-- in-memory match against known countries list
filter KNOWN_COUNTRIES WHERE name.lower() CONTAINS 'copper'
                       OR id CONTAINS 'copper'
```

Returns shape:

```json
{
  "query": "copper",
  "news": [...],
  "projects": [...],
  "countries": [],
  "totals": { "news": 5, "projects": 1, "countries": 0 }
}
```

## 5.4 Result ordering in the palette

In `SearchPalette.tsx`:

```typescript
1. Countries (most specific, smallest cohort)
2. Projects
3. News
```

This is intentional: when a user searches "Italy", they probably want to navigate to the Italy country page, not see articles *about* Italy.

## 5.5 Keyboard navigation

| Key       | Action                                          |
|-----------|-------------------------------------------------|
| ↑ / ↓     | Move `activeIdx` within bounds                  |
| Enter     | Call `items[activeIdx].onSelect()`              |
| ESC       | Close palette                                   |
| Type      | Updates `q`, resets `activeIdx` to 0 on debounce |

Mouse hover also updates `activeIdx`. Click executes `onSelect`.

## 5.6 Dispatch per type

| Result type | onSelect action                                  |
|-------------|--------------------------------------------------|
| country     | `navigate('/country/' + c.id)` + close palette   |
| project     | `navigate('/projects/' + p.id)` + close palette  |
| news        | `window.open(n.url, '_blank')` + close palette   |

## 5.7 Phase 1 — semantic search upgrade

The current ILIKE approach is a lexical "starts/contains" matcher. Phase 1 makes it hybrid:

1. **BM25 lexical** match on title + summary → top 100 candidates
2. **Vector cosine** (Voyage-3-large, 1024-dim) on full content → top 100 candidates
3. **Re-rank** with Reciprocal Rank Fusion (RRF, k=60)
4. Render with lexical highlights + similarity score

PostgreSQL with `tsvector` + pgvector handles both in one database below ~10M documents.

## 5.8 Acceptance criteria — search

| AC-ID     | Criterion                                                                    |
|-----------|------------------------------------------------------------------------------|
| SEARCH-1  | Below 2 chars, palette shows "Type at least 2 characters" hint               |
| SEARCH-2  | Search latency p95 < 400ms (single-region, 10K rows)                         |
| SEARCH-3  | Result groups appear in country → project → news order                        |
| SEARCH-4  | Enter on selected row navigates or opens, palette closes                     |
| SEARCH-5  | ESC closes even with an in-flight query                                       |
| SEARCH-6  | No results message: `No results for "{q}"` after the in-flight finishes      |

---

# 6. Review Queue (HITL) — complete workflow spec

This is the operational core of the platform. The brief specifies a **human-in-the-loop** validation step on every AI output before it propagates downstream. This section documents the state machine, transitions, audit log, and feedback loop in full.

![Review Queue main](manual-screenshots/04-review-queue.jpg)

## 6.1 State machine

```
                ┌─────────────────────────────────┐
                ▼                                 │
           ┌─────────┐  accept       ┌────────────┴───┐  publish      ┌─────────────┐
           │  draft  │ ─────────────▶│   validated    │ ─────────────▶│  published  │
           └─────────┘ save-edit-acc.└────────────────┘               └─────────────┘
                │                            │
                │ reject                     │
                ▼                            │
           ┌──────────┐                      │
           │ rejected │ ◀───── restore ──────┘
           └──────────┘
```

| Transition           | Trigger                              | Side effects                                            |
|----------------------|--------------------------------------|---------------------------------------------------------|
| (new)→draft          | Agent writes item, surfacing rule passes | Item appears in Review Queue list                   |
| draft→validated      | MI clicks Accept                     | `decided_by`, `decided_at`, optional feedback stored    |
| draft→validated      | MI clicks Save edits + Accept        | `edited_title` saved, `decided_by/at/feedback` stored   |
| draft→rejected       | MI clicks Reject                     | feedback stored, item dimmed in UI                       |
| validated→published  | MI clicks Publish now                | item becomes visible in public Hub views (newsletter)    |
| rejected→draft       | MI clicks Restore to queue           | item re-enters draft pool                                |

In **Phase 1** the `validated → published` transition is automated through an editorial workflow (daily digest) instead of one-click. But the manual override stays available.

## 6.2 Surfacing rule (what enters the queue?)

A new agent-produced item enters Review Queue **draft** state iff:

```
confidence       >= agent.surfacing_threshold     (default 0.65)
AND relevance_score >= agent.relevance_threshold  (default 0.65)
AND NOT exists duplicate(item.url, last 48h)
```

Items below either threshold are written to gold (still searchable) but **not** queued for review. This prevents alert fatigue.

## 6.3 List rendering rules

The list (left pane) is queried via `/api/review/queue?status_filter=draft&limit=80`.

Each row shows (top to bottom):

| Row element       | Source                                      |
|-------------------|---------------------------------------------|
| Type icon         | newspaper for `news`, pickaxe for `project` |
| Agent label       | `agent.replace('_', ' ')` ALL CAPS          |
| Status chip       | tone map: draft=amber, validated=green, rejected=red, published=blue |
| Confidence chip   | tone band by score (see §6.5)               |
| Relative time     | `relTime(curated_at)`                       |
| Title (2 lines)   | `title` (or `edited_title` if present)      |
| Source + country  | `source` and `country` (when present)       |

Click selects the item, populating the right detail pane. Active row gets `bg-prysmian-green/8` highlight.

## 6.4 Detail pane

![Review detail](manual-screenshots/05-review-detail-validated.jpg)

The right pane has 4 sections:

### 6.4.1 Header

- Type icon · status badge · agent badge · confidence chip · country chip · segment chips
- Title (editable inline — click *Edit title* button)
- Sub: edited_title diff line if `title !== original_title`
- Summary (`item.summary`)
- Action row: **Open source** · **Evidence bundle** · **Edit title**

### 6.4.2 AI reasoning callout

> Flagged by News Finder agent: matches Prysmian taxonomy (segments: copper, commodities; geography: Peru). Relevance score: 0.62.

Generated server-side in `backend/api/review.py`:

```python
def _ai_reason(item_type, item):
    if item_type == "news":
        return (
            f"Flagged by News Finder agent: matches Prysmian taxonomy "
            f"(segments: {', '.join(item.segments or []) or 'general'}; "
            f"geography: {', '.join(item.countries or []) or 'global'}). "
            f"Relevance score: {float(item.relevance_score):.2f}."
        )
    return (
        f"Flagged by Project Scouting agent: {item.project_type or 'mining'} "
        f"project in {item.country or 'unspecified region'} with estimated "
        f"${float(item.capex_estimate_musd or 0):,.0f}M CAPEX. "
        f"Cable demand exposure: ~{float(item.cable_demand_estimate_km or 0):,.0f} km."
    )
```

### 6.4.3 Decision history strip (only when decided)

> Decided 3m ago by `user@prysmian.com`
> "Geography too broad, restrict to Italy."

### 6.4.4 Feedback + actions (only when status = draft)

- Textarea: optional feedback, placeholder example shown
- Buttons: **Accept** (green) · **Save edits + Accept** (Prysmian green, only enabled when `editing == true`) · **Reject** (white)

For `validated` state: replaced with a `Publish now` button.
For `rejected` state: replaced with a `Restore to queue` button.

## 6.5 Confidence display rules

| Score range | Chip color | Recommended MI action                        |
|-------------|------------|----------------------------------------------|
| ≥ 85%       | green      | Likely accept; spot-check                    |
| 70–84%      | blue       | Read fully before accepting                  |
| 50–69%      | amber      | Scrutinize; likely needs edit or reject      |
| < 50%       | (not surfaced) | Not queued (auto-discarded)              |

## 6.6 Feedback loop ("AI evaluation reinforcement")

When MI submits a decision with feedback text, the demo logs it to in-memory state. In Phase 1:

1. Each feedback row joins the **agent evaluation set** (`audit.review_decisions`)
2. Weekly cron replays the evaluation set against the current agent prompts/rules
3. Items where the new agent output disagrees with the historical MI decision are flagged as "regression risks"
4. Prompt tuning / rule changes that improve the alignment % are promoted to production

This is the **reinforcement-via-evaluation** pattern the brief asks for. Note: no online RLHF — the loop is deliberate, MI-curated, and auditable.

## 6.7 Audit trail

Every item in any non-draft state shows on the detail panel:

> Decided 3m ago by `user@prysmian.com`
> "Geography too broad, restrict to Italy."

This satisfies the brief's *"versioning + audit trail"* requirement. In Phase 1 the audit trail is append-only and immutable (write to `audit.review_decisions` with no UPDATE allowed at DB level — Postgres role with INSERT/SELECT only).

## 6.8 API surface — Review Queue

| Endpoint                          | Method | Body / Query                                  | Returns                  |
|-----------------------------------|--------|-----------------------------------------------|--------------------------|
| `/api/review/queue`               | GET    | `item_type` (news\|project\|null), `status_filter`, `limit` | `{items[], total}`       |
| `/api/review/stats`               | GET    | —                                             | `{by_status, total_items, decisions_logged}` |
| `/api/review/{item_id}/decide`    | POST   | `{status, feedback?, edited_title?, decided_by?}` | `{ok, item_id, ...}`     |

## 6.9 Live counter refresh

Sidebar `Review queue` badge polls `/api/review/stats` every **20 seconds** via React Query. UI updates when `by_status.draft` changes.

```typescript
useQuery({
  queryKey: ["review-stats-nav"],
  queryFn: ...,
  refetchInterval: 20000,
});
```

## 6.10 Acceptance criteria — Review Queue

| AC-ID     | Criterion                                                                                |
|-----------|------------------------------------------------------------------------------------------|
| REV-1     | Drafts list updates within 20s of an agent run completing                                |
| REV-2     | Accept transitions item to validated, removes from `status_filter=draft` list            |
| REV-3     | Feedback text persists across page reloads (Phase 1: stored in DB)                       |
| REV-4     | Edit title diff line shows in detail panel when titles differ                            |
| REV-5     | Rejected items can be restored to draft                                                   |
| REV-6     | All transitions log decided_by + decided_at + feedback in `audit.review_decisions`       |
| REV-7     | UPDATE/DELETE on `audit.review_decisions` rejected by DB role permissions                 |

---

# 7. AI Agents — per-agent specs

![Agents Control Center](manual-screenshots/06-agents.jpg)

The brief specifies **six always-on AI agents**. This section is the complete spec for each one: inputs, processing, outputs, schedule, confidence, routing, failure modes, acceptance criteria.

## 7.1 Agent design patterns (shared)

All agents share the same `BaseAgent` abstraction (mimicking Databricks Agent Bricks):

```python
class BaseAgent:
    name: str
    version: str
    keywords: list[str]
    geography: list[str]
    confidence_threshold: float

    def run(self, bounded: bool = False, max_items: int = None, timeout_seconds: int = None):
        run_id = self._start_audit_run()
        try:
            sources = self._fetch_sources()
            for source in sources:
                items = self._extract(source)
                for item in items:
                    if not self._dedupe(item): continue
                    confidence = self._score(item)
                    if confidence < self.confidence_threshold: continue
                    evidence_id = self._write_evidence(item, confidence)
                    self._write_to_gold(item, evidence_id)
                    if bounded and self.items_produced >= max_items: break
                if bounded and timeout_seconds and self._elapsed() > timeout_seconds: break
            self._end_audit_run(run_id, status="success")
        except Exception as e:
            self._end_audit_run(run_id, status="error", error=str(e))
            raise
```

Common patterns:

- **Bounded runs** for on-demand triggers (max items, max seconds) to prevent runaway costs
- **Dedup** at URL/content level over a sliding window
- **Evidence-first**: write evidence record before gold record (so even partial writes are traceable)
- **Audit**: every run logged with timing, tokens, status, error

## 7.2 Project Scouting Agent

**Status: implemented (`mining_cable_specialist`)**

### Input

- Sources: `mining.com`, `S&P Global`, `Reuters mining feed`, `BNEF press releases`, `BloombergNEF`
- Configurable keywords: `mining`, `grid`, `data center`, `BESS`, `renewable`
- Geography filter (default: EU, UK, MENA)

### Processing

1. **Retrieve** — fetch RSS / API feeds since last successful run
2. **Filter** — keyword match on title + first 500 chars
3. **Extract** — LLM (Claude Sonnet 4.6) extracts structured entities:
   - Project name, owner, country
   - Project type (`copper` / `lithium` / `data_center` / `wind` / `grid` / `BESS`)
   - CAPEX in MUSD (with currency conversion from raw publication currency via published FX)
   - Capacity MW where applicable
   - Start/end years
   - Status (mapping vendor terms → `planning|construction|operational|cancelled`)
4. **Derive cable demand** (see §15.2)
5. **Score confidence** (see §15.4)
6. **Score flagged_of_interest** (see §15.3)
7. **Write back** — single transaction:
   - INSERT into `gold.mining_projects`
   - INSERT into `audit.evidence_metadata` with source URLs and confidence breakdown
   - Surfaces to Review Queue as `draft` if confidence ≥ surfacing threshold

### Prompt template (Phase 1, sketch)

```text
You are an industrial market intelligence analyst.

From the following article excerpt, extract a single mining/grid/datacenter/renewable
project record as STRICT JSON:

  { "name": str, "owner": str, "country": str, "project_type": one_of(
       "copper","lithium","nickel","cobalt","REE","data_center","wind","solar",
       "BESS","grid","other"),
    "capex_estimate_musd": float|null, "capacity_mw": float|null,
    "start_year": int|null, "end_year": int|null,
    "status": one_of("planning","construction","operational","cancelled"),
    "currency_raw": str|null, "extraction_confidence": float in [0,1] }

If the article does not describe ONE project, return: { "skip": true, "reason": str }.

Cite the spans you used. Output JSON only, no commentary.

ARTICLE:
"""
{article_text}
"""
```

### Output schema → see §13.1.2

### Schedule
- Default: every 6 hours (cron `0 */6 * * *`)
- Bounded runs (max 3 items, 30s timeout) when triggered via `/api/agents/.../run`

### Failure modes

| Failure                       | Behavior                                                                |
|-------------------------------|-------------------------------------------------------------------------|
| Source unreachable            | log error in `audit.agent_runs`, retry next cycle, alert ops after 3 fails |
| LLM rate-limit                | fallback to Claude Haiku 4.5 with explicit `agent_version: haiku-fallback` tag |
| Extraction confidence < threshold | item still written but flagged `low_confidence`, surfaced in Review Queue with amber chip |
| JSON parse error              | log raw output to `audit.agent_runs.error_message`, skip item            |
| Currency conversion missing FX| flag item, leave CAPEX null, MI sees red chip                            |

### Performance SLAs

| Metric                       | Target                          |
|------------------------------|---------------------------------|
| Run latency p95 (3 items)    | < 30s                           |
| Cost per item                | < $0.03 (Sonnet) / $0.005 (Haiku) |
| Daily runs                   | 4× scheduled + on-demand        |

## 7.3 News Finder Agent

**Status: implemented (`news_finder`)**

### Input

- Sources: 8+ industry publications + Google News RSS for keyword sets
- Configurable keywords: `cable`, `copper`, `energy`, `EV`, `grid` (extensible)
- Geography filter: EU + Global

### Processing

1. Fetch RSS / scrape with rate-limit (1 req/sec per source)
2. **Deduplicate** — URL canonicalization + 24h sliding window
3. LLM extracts:
   - 2-3 sentence summary (system prompt: *"Summarize for a senior MI analyst, neutral tone, max 3 sentences."*)
   - segments (taxonomy match)
   - countries (NER + ISO normalization)
   - **relevance_score** ∈ [0,1] (see §15.1)
4. Write to `gold.news_curated` + `audit.evidence_metadata`
5. Items with `relevance_score ≥ 0.65` enter Review Queue as `draft`
6. Items with `relevance_score < 0.65` are written but **not surfaced** to Review Queue (still searchable, but stay quiet)

### Schedule
- Default: every 3 hours
- Cost: ~$0.02 per article extracted (Sonnet) — budget ~$10/day at ~500 articles/day

## 7.4 Micro/Macro KPI Alerts Agent

**Status: planned (Phase 2)**

### Input

- KPI feeds: GDP, construction output, building permits, copper LME, interest rates, FX rates
- Configurable per-BU thresholds (e.g., "alert when Italy construction output MoM < −3%")
- Geography: EU + Global commodity

### Processing

1. Daily scheduled run pulls fresh KPI values from official sources (Eurostat, Istat, LME)
2. For each `(kpi, country, bu)` triple, compute:
   - MoM delta = `(value_t − value_{t−1}) / value_{t−1}`
   - YoY delta = `(value_t − value_{t−12}) / value_{t−12}`
   - z-score over 24-month history
3. Rule engine matches against subscribed thresholds (stored in `runtime.alert_rules`)
4. When matched, emit `Alert` with severity:
   - `high` if `|delta|` > 2× threshold OR z-score > 2.5
   - `medium` if `|delta|` > threshold OR z-score > 1.5
   - `low` otherwise
5. Confidence ≥ 0.7 always (data is structured, low uncertainty)
6. Routing: see §8.4

## 7.5 Market Trends & Tech Swift Finder

**Status: planned (Phase 2)**

### Input

- Tech blogs, ArXiv abstracts (cable/EE category), patent filings (USPTO, EPO), conference papers
- Keywords: HVDC, solid-state, subsea, high-voltage, smart grid, …

### Processing

- Compute embeddings on each candidate (Voyage-3-large)
- Cosine similarity against Prysmian's tech-radar topic vectors (curated by R&D team)
- Top-K with similarity > 0.7 → Review Queue as `swift_finder` drafts
- LLM summarizes "what's new" and "why it matters for Prysmian"

## 7.6 Customer Monitoring

**Status: planned (Phase 2)**

### Input

- Subscribed customer list (Terna, Enel, EDF, RWE, TenneT) — synced from Salesforce nightly
- Salesforce account list

### Processing

- Per-customer: news + filings (SEC/CONSOB) + LinkedIn execs feed
- Event extraction: project wins, leadership changes, capacity expansion, capex announcements
- Each event becomes a `customer_event` row + alert if subscribed
- Severity: events that change the customer's procurement profile → high

## 7.7 Competitor Monitoring

**Status: planned (Phase 2)**

### Input

- Competitor list: Nexans, NKT, Hellenic Cables, LS Cable, …

### Processing

- Same pipeline as Customer Monitoring but classified by `competitor` keyword
- Events: pricing moves, M&A, capacity, financials
- All competitor news routes to `competitor` alert type with severity computed from event class

## 7.8 Agent control endpoints

| Endpoint                       | Method | Returns                                         |
|--------------------------------|--------|-------------------------------------------------|
| `/api/agents/catalog`          | GET    | All 6 agents enriched with last-run, runs_count |
| `/api/agents/{id}/toggle`      | POST   | Flip `enabled` flag                              |
| `/api/agents/{name}/run`       | POST   | Trigger background bounded run                  |
| `/api/agents/runs`             | GET    | Last 50 runs from `audit.agent_runs`            |

## 7.9 Agent card UI logic

| Field shown          | Source                                                       |
|----------------------|--------------------------------------------------------------|
| Status badge         | `enabled && implemented` → running, `!enabled && implemented` → paused, `!implemented` → planned |
| Schedule             | static config string ("Every 6h", "Daily", etc)              |
| Last run             | `relTime(last_run)` from latest `audit.agent_runs` row       |
| Last run status icon | green check / red X / nothing                                |
| Feedback %           | `round(feedback_score * 100)`                                |

## 7.10 Agent config drawer

![Agent config drawer](manual-screenshots/07-agent-config.jpg)

Configurable fields (Phase 1, persisted to `runtime.agent_config`):

| Field                | Type            | Example                                             |
|----------------------|-----------------|-----------------------------------------------------|
| Keywords             | chip list       | mining, grid, data center, …                        |
| Geography filter     | chip list       | EU, UK, MENA                                        |
| Schedule             | cron string     | `0 */6 * * *`                                       |
| Routing channels     | bool×3          | in_app, email, teams                                |
| Confidence threshold | slider 50–95    | default 70                                          |

Changes here re-deploy the agent's runtime config without code change (taxonomy as data, not code).

## 7.11 Acceptance criteria — Agents

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| AGT-1    | Catalog lists exactly 6 agents                                                            |
| AGT-2    | Implemented agents show "running" or "paused"; planned agents show "Phase 2 · Coming soon" |
| AGT-3    | "Run now" triggers a bounded run; status visible within 30s in Last run                  |
| AGT-4    | Pause sets enabled=false, scheduled runs do not fire                                     |
| AGT-5    | Config save persists across page reloads (Phase 1: DB)                                   |
| AGT-6    | Audit trail entry created for every run, success or failure                              |

---

# 8. Alerts engine — triggering, severity, routing

![Alerts inbox](manual-screenshots/08-alerts.jpg)

## 8.1 Alert sources

Alerts are **synthesized** from existing data (demo) or emitted by KPI agent (Phase 1):

| Alert type   | Source data                                | Trigger condition                                          |
|--------------|--------------------------------------------|------------------------------------------------------------|
| `project`    | `gold.mining_projects`                     | `flagged_of_interest = true` AND created in last N days   |
| `news`       | `gold.news_curated`                        | `relevance_score >= 0.65`                                  |
| `competitor` | `gold.news_curated` (sub-classified)       | news title matches competitor keyword regex                |
| `kpi`        | `gold.commodity_indicators`, `gold.market_trends` | threshold rule matched                              |

## 8.2 Severity classification

```python
def _classify_severity(score: float) -> str:
    if score >= 0.85: return "high"
    if score >= 0.65: return "medium"
    return "low"
```

Per type-specific scoring:

- **news/competitor**: `relevance_score`
- **project**: derived → `high` if CAPEX > $500M, `medium` otherwise (currently fixed; Phase 1 adds BU exposure factor)
- **KPI**: derived → `high` if |delta| > 2× threshold else `medium`

## 8.3 Trigger reason (transparency)

Every alert exposes a structured `trigger_reason` string:

- News/competitor: *"Relevance score 0.78 above 0.65 threshold."*
- Project: *"Strategic flag triggered — high CAPEX and Prysmian BU exposure."*
- KPI: *"Threshold rule: copper_lme MoM > +5%. Confidence 0.92."*

Intentionally **machine-readable** (agent name + rule that fired) so MI can identify and tune the rule directly.

## 8.4 Subscriptions & routing

![Subscriptions drawer](manual-screenshots/09-subscriptions.jpg)

The user's subscription preferences gate which alerts land where:

```python
alert_visible_to_user = (
    severity_rank(alert.severity) >= severity_rank(user.min_severity)
    AND (
        alert.country in user.subscribed_countries
        OR (alert.type == 'kpi' AND alert.bu in user.subscribed_bus)
        OR (alert.type in {'news','competitor'} AND alert.topic in user.subscribed_topics)
    )
    AND user.channels.in_app == True   # at minimum
)
```

Where `severity_rank('low')=1`, `'medium'=2`, `'high'=3`.

Same rule applies per channel (`email`, `teams`): if user has email disabled, the alert lands in-app only.

## 8.5 Subscription persistence

Demo: in-memory single user (`_SUBSCRIPTIONS` dict in `backend/api/alerts.py`).

Phase 1: per-user JSON in `users.preferences`:

```json
{
  "channels": { "in_app": true, "email": false, "teams": false },
  "bu": ["transmission", "grid", "renewables"],
  "countries": ["Italy", "France", "Germany"],
  "topics": ["copper", "permits", "competitor_moves", "new_projects"],
  "min_severity": "medium"
}
```

PUT to `/api/alerts/subscriptions` with partial body updates only the provided fields.

## 8.6 Read-state

An alert's `read` flag is per-user. Demo: in-memory set; Phase 1: join table `(user_id, alert_id, read_at)`.

POST `/api/alerts/{alert_id}/read` with body `{ "read": true|false }`.

## 8.7 Default subscription policy

New users get a sensible default:

```
channels: { in_app: true, email: false, teams: false }
bu: ["transmission", "grid", "renewables"]
countries: [user's country from HR feed]
topics: ["copper", "permits", "new_projects", "competitor_moves"]
min_severity: "medium"
```

MI lead role onboarding sets this from Entra/HR attributes; user can override.

## 8.8 Card rendering

Per alert in the inbox:

| Element              | Source                                                            |
|----------------------|-------------------------------------------------------------------|
| Type icon            | type-based: TrendingUp (kpi), Building2 (project), Newspaper (news), Swords (competitor) |
| Severity badge       | tone map                                                          |
| Type chip            | static text                                                       |
| Country chip         | if present                                                        |
| Confidence chip      | sparkle icon + `{confidence}%`                                    |
| NEW chip             | if `!read`                                                        |
| Title (bold)         | `title`                                                           |
| Body (2 lines)       | `body`                                                            |
| Trigger callout      | sparkle icon + `Trigger: {trigger_reason}`                        |
| Open link            | internal route (`startsWith('/')`) or external URL                |
| Mark read/unread     | toggle button                                                     |

Read items get 60% opacity (`opacity-60`) so unread items stand out.

## 8.9 API surface — Alerts

| Endpoint                       | Method | Body / Query                              | Returns                       |
|--------------------------------|--------|-------------------------------------------|-------------------------------|
| `/api/alerts`                  | GET    | `severity?`, `type_filter?`               | `{ alerts[], total }`         |
| `/api/alerts/stats`            | GET    | —                                         | `{ total, unread, by_type, by_severity }` |
| `/api/alerts/{id}/read`        | POST   | `{ read: bool }`                          | `{ id, read }`                |
| `/api/alerts/subscriptions`    | GET    | —                                         | `{ channels, bu, countries, topics, min_severity }` |
| `/api/alerts/subscriptions`    | PUT    | partial Subscriptions                     | merged Subscriptions          |

## 8.10 Acceptance criteria — Alerts

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| ALT-1    | Stats counters match alerts list under same filters                                       |
| ALT-2    | Marking read decreases unread count; refresh interval ≤ 30s for header badge              |
| ALT-3    | Filter chips combine (AND between type and severity, OR within each)                      |
| ALT-4    | Subscriptions PUT with partial body only updates provided fields                          |
| ALT-5    | Open button routes to internal page for `/...` links, opens new tab for `http*` URLs     |
| ALT-6    | Phase 1: alerts below `min_severity` are filtered out at the API layer, not just UI       |

---

# 9. Country ID — full calculation reference

![Country ID Italy](manual-screenshots/10-country-italy.jpg)

The **Country Identity Card** is the most metric-dense screen. Every number is documented here.

## 9.1 Country switcher

- 5 countries: Italy (live), France, Germany, Spain, Netherlands (Phase 2 placeholder)
- Active country: green pill
- Phase 2 countries: outline pill + `P2` chip + opacity 70%
- Right-aligned: link to `/compare`

When user clicks a Phase 2 country, the page renders a placeholder card with two CTAs:
- "Country news" → `/news`
- "Country projects" → `/projects?country={name}` (filter pre-applied)

## 9.2 AI Country Insight banner

Templated paragraph. Inputs (`Italy` example, live numbers):

| Variable          | Source                                                                |
|-------------------|-----------------------------------------------------------------------|
| `total_sow`       | `total_mySales / total_marketValue`                                   |
| `n`               | `len(sales_by_customer)`                                              |
| `total_market_value` | `Σ market_value_by_customer.value`                                 |
| `total_white_space`  | `total_market_value - total_mySales`                                |
| `top_gap.name`    | first row of `sow[]` sorted by `gap` desc                              |
| `top_gap.share`   | `top_gap.mySales / top_gap.market`                                    |
| `top_gap.gap`     | `top_gap.market - top_gap.mySales`                                    |

Template:

```
Prysmian holds a {total_sow:.0%} average share-of-wallet across the top {n} customers,
on a tracked market of €{total_market_value/1000:.0f}k.
Total white space ~€{total_white_space/1000:.0f}k across the cluster.
Highest gap: {top_gap.name} (only {top_gap.share:.0%} share, €{top_gap.gap/1000:.0f}k untapped)
— recommended priority for sales expansion.
```

Why templated, not LLM-generated? **Determinism + audit safety**. The numbers are always provably correct because they come from the same data the user sees. In Phase 1 an LLM can wrap stylistic variety around the same template, but the underlying calculation stays auditable.

## 9.3 Macro snapshot tiles

| Tile                  | Formula                                                |
|-----------------------|--------------------------------------------------------|
| Total share of wallet | `total_mySales / total_marketValue` (% formatted)      |
| My sales (cluster)    | `Σ sales_by_customer.value` (€XXXk formatted)          |
| White space           | `Σ max(0, market_value - my_sales)` per customer       |
| GDP trend             | `trends.indicators['gdp'].series[-1].value`            |

## 9.4 Filter bar

- **Business Unit chips** — `I&C`, `Power Grid`, `Digital Solutions`, `Railway`, `Wind onshore`, `Solar`
  - **Demo**: filter applied but values unchanged; UI shows italic helper text "Filter applied (demo: values unchanged, Phase 1 wires real BU split)"
  - **Phase 1**: queries filter by `bu_filter` parameter; values recompute per BU split stored in silver
- **Export CSV** — client-side blob download with all 4 quadrants flattened to CSV (`quadrant, name, value_eur, detail`)

## 9.5 Quadrant 1 — Sales by Customer

Source: `gold.country_summary.sales_by_customer` (CSV seed in demo).

Per row:

| Column      | Logic                                                              |
|-------------|--------------------------------------------------------------------|
| Rank        | `#{i+1}` from sorted order (input order = pre-sorted by value desc) |
| Name        | `r.name`                                                           |
| Share %     | `(r.value / total_mySales) * 100`                                   |
| Value       | `€{r.value:,}`                                                      |
| Bar width   | `max(2, (r.value / max(*values)) * 100)%`                          |
| Bar color   | green (Prysmian)                                                    |

Click → drill modal (§10).

## 9.6 Quadrant 2 — Sales by Product

Identical structure to Quadrant 1, except:

| Column      | Logic                                                              |
|-------------|--------------------------------------------------------------------|
| Bar color   | blue                                                                |
| Drill modal | SAP material master tab instead of Salesforce account              |

## 9.7 Quadrant 3 — Competitors

Source: `gold.country_summary.competitors` (only name + tier in seed).

Synthesized fields (demo only, see §11):

| Field         | Logic                                                              |
|---------------|--------------------------------------------------------------------|
| Tier          | parse from `detail` field: contains "1" → 1 else 2                 |
| Market share %| `max(2, base_share + perturbation)` where `base_share = (18 - i*2)` for Tier 1, `(9 - i)` for Tier 2 |
| Trend         | `i%3 == 0` → up (threat), `== 1` → down (favourable), `== 2` → flat |
| Bar color     | red (Prysmian competitor)                                          |

## 9.8 Quadrant 4 — Share of Wallet (AI insight)

The killer view. Computed client-side from quadrants 1 and 4 of the original brief:

```typescript
const mvbcMap = new Map(market_value_by_customer.map(r => [r.name, r.value]));
sow = sales_by_customer.map(s => {
  const mySales = s.value;
  const market = mvbcMap.get(s.name) ?? 0;
  const share = market > 0 ? mySales / market : 0;
  const gap = max(0, market - mySales);
  return { name: s.name, mySales, market, share, gap };
}).sort((a,b) => b.gap - a.gap);   // biggest gap on top
```

Per row:

| Element       | Logic                                                              |
|---------------|--------------------------------------------------------------------|
| Name          | `r.name`                                                           |
| SoW chip      | `< 40%` amber, `40–69%` blue, `≥ 70%` green                        |
| Gap label     | `€{r.gap:,} gap`                                                    |
| Stacked bar   | green portion = `mySales/maxMarket`, amber portion = `gap/maxMarket`|

The bar visually communicates *both* current footprint and untapped opportunity in a single horizontal element.

## 9.9 SoW band classification

| Band      | Interpretation                                          | Strategy                          |
|-----------|---------------------------------------------------------|-----------------------------------|
| < 40%     | Low penetration                                         | Share-shift initiative            |
| 40–69%    | Mid-share                                                | Cross-sell room                   |
| ≥ 70%     | Incumbent                                                | Defend & protect margin           |

## 9.10 Country news + Active alerts (bottom panels)

**Latest news** — `useNews()` filtered client-side:

```typescript
news.filter(n => n.countries?.some(c => c.toLowerCase() == country.toLowerCase()))
    .slice(0, 4);
```

Per row: source, time, "High" relevance chip if score ≥ 0.7, title, summary.

**Active alerts** — `/api/alerts` filtered client-side by country (or null country = global):

```typescript
alerts.filter(a => !a.country || a.country.toLowerCase() == country.toLowerCase())
      .slice(0, 4);
```

Per row: severity icon + badge, type, title, agent label, confidence %.

## 9.11 API surface — Country ID

| Endpoint                          | Method | Returns                                  |
|-----------------------------------|--------|------------------------------------------|
| `/api/countries`                  | GET    | List of country IDs available            |
| `/api/countries/{id}/summary`     | GET    | `{ country, sales_by_customer[], sales_by_product[], competitors[], market_value_by_customer[] }` |
| `/api/trends/{country}`           | GET    | macro indicators (used for GDP tile)     |
| `/api/news`                       | GET    | news list (filtered client-side)         |
| `/api/alerts`                     | GET    | alerts list (filtered client-side)       |

## 9.12 Acceptance criteria — Country ID

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| CTY-1    | AI banner uses live numbers matching the macro tiles                                      |
| CTY-2    | SoW quadrant rows sorted by `gap` desc                                                    |
| CTY-3    | Customer drill-down opens SF tab; product drill-down opens SAP tab                        |
| CTY-4    | Export CSV produces valid CSV with all 4 quadrants                                        |
| CTY-5    | Phase 2 country page does NOT 404 — shows informative placeholder                         |
| CTY-6    | News + Alerts panels show count=0 message when empty                                      |

---

# 10. Drill-down modals — Salesforce + SAP

## 10.1 Modal layout

![MI Hub overview tab](manual-screenshots/11-country-drill-overview.jpg)

Two tabs:

- **MI Hub overview** — Prysmian-internal view (value, SoW, AI suggestion)
- **Salesforce record** OR **SAP material master** — system-of-record view

Header: type icon, kind chip, name (bold), country sub-line, close X.
Footer: Close + dynamic primary CTA (Salesforce / SAP / Competitor dossier).

## 10.2 MI Hub overview tab

| Element              | Logic                                                              |
|----------------------|--------------------------------------------------------------------|
| Tracked value        | `€{item.value:,}` if not null                                       |
| SoW bar              | only if `item.sow != null`                                          |
| Detail line          | passed string                                                       |
| AI suggestion        | from `drillSuggestion(item)` (see §10.5)                            |
| Footer hint          | static "Phase 1 unlocks: order history, contract list, pipeline, evidence trail." |

## 10.3 Salesforce record tab

![Salesforce record](manual-screenshots/12-salesforce-record.jpg)

Salesforce-style account page. **Deterministic synthetic** based on `hashCode(name)` (see §11.1).

| Section                   | Content                                                             |
|---------------------------|---------------------------------------------------------------------|
| Breadcrumb                | `Accounts › {name}` in SF blue (`#006DCC`)                          |
| Avatar                    | initials of `name` words (max 2), blue background                   |
| Account ID                | `0015e0000{hash%99999:05}AAA` mimicking SF ID format                |
| Highlight strip (4 cols)  | Type, Account Owner (Italian names list), Industry, Customer since  |
| Account information panel | name, phone, website, billing country, annual revenue, employees    |
| Prysmian relationship panel | tier, sales YTD, SoW %, open opps, closed/won YTD, last activity  |
| Key contacts (full row)   | 2 contacts with initials avatars, role, clickable email             |
| Open opportunities table  | 3 mock opps with stage (Qualification/Proposal/Negotiation), amount, close date |
| Footer hint               | "Demo view · in Phase 1 this opens the live record at {name}.my.salesforce.com" |

### Phase 1 integration

```
GET https://prysmian.my.salesforce.com/services/data/v59.0/sobjects/Account/{salesforce_id}
Authorization: Bearer {oauth_token}
```

Cached for 15 minutes. Editable fields write back through the same API with full audit.

## 10.4 SAP material master tab

![SAP material master](manual-screenshots/13-sap-material.jpg)

SAP-Fiori-style material master. **Deterministic synthetic**.

| Section              | Content                                                                 |
|----------------------|-------------------------------------------------------------------------|
| Top bar (SAP blue)   | `SAP › Material Master · Display › {matNo}` · `Client 100 · EUR`        |
| Material header      | mono `PRY-{type}-{hash%99999:05}`, material type badge                  |
| 4 metadata cells     | material group, base UoM (KM/M/KG), industry sector, plant scope        |
| Basic data 1 panel   | material #, description, type, group, base UoM, gross weight            |
| Sales: sales org panel | sales org (IT00 — Prysmian Italia / EU00 — Prysmian Europe), distribution channel, standard price, moving avg price, tax classification, sales status |
| Plants & storage table | plant codes (IT01 — Pignataro Maggiore, IT02 — Battipaglia, IT05 — Livorno for Italy; DE01/FR01 for others), storage location, MRP type, stock, lead time |
| MI Hub link tile     | sales YTD, volume YTD, top customer                                     |
| Footer hint          | "Demo view · in Phase 1 this calls SAP RFC `BAPI_MATERIAL_GET_DETAIL` for live data" |

### Phase 1 integration

```
RFC: BAPI_MATERIAL_GET_DETAIL
Input: MATERIAL = PRY-MV-45489
        PLANT = IT01
Returns full material master record + plants + storage locations
```

Cached for 1 hour. Standard price reads are common; full master data refresh nightly.

## 10.5 AI suggestion rules (deterministic)

```python
def suggestion(kind, sow):
    if kind == "Customer":
        if sow < 0.40: return "Low share … propose share-shift initiative for Q3."
        if sow < 0.70: return "Stable mid-share. Cross-sell adjacent product lines (HV, accessories) to lift wallet."
        return "Strong incumbent. Defend with multi-year framework and protect margin."
    if kind == "Competitor":
        return "Monitor for pricing moves and capacity changes — flagged in Competitor Monitoring agent."
    if kind == "Product":
        return "Watch demand signals tied to this product — link to Trends for macro context."
```

In Phase 1 these become LLM-generated with grounded prompting (RAG over CRM + history). The deterministic rules remain as a fallback when LLM is unavailable.

## 10.6 Acceptance criteria — Drill modals

| AC-ID    | Criterion                                                                          |
|----------|------------------------------------------------------------------------------------|
| DRL-1    | Same customer name always produces the same SF record (deterministic hash)         |
| DRL-2    | Same product name always produces the same SAP master record                       |
| DRL-3    | Tab switch preserves modal context (no reset of which item)                        |
| DRL-4    | SoW bar only renders for customers, not products                                   |
| DRL-5    | All field labels match the system-of-record conventions (Account, Material, etc)   |

---

# 11. Synthetic data engineering

The demo uses **deterministic synthetic** data wherever live integrations are not yet in place (Salesforce, SAP, competitor share, etc).

## 11.1 The hash function

```typescript
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
function pick<T>(seed: number, arr: T[]): T {
  return arr[Math.abs(seed) % arr.length];
}
```

This is a 32-bit FNV-like hash. **Deterministic** (same input → same hash → same synthetic data across all renders and all sessions). Critical for demo coherence.

## 11.2 Salesforce account synthesis

| Field           | Derivation                                                                |
|-----------------|---------------------------------------------------------------------------|
| Account ID      | `0015e0000{(|hash| % 99999):05}AAA` — mimics Salesforce ID format         |
| Industry        | `pick(seed, ["Utility · Transmission", "Utility · Distribution", "Renewable energy", "Industrial · OEM", "Data center operator", "Infrastructure contractor"])` |
| Tier            | `pick(seed, ["Tier 1 · Strategic", "Tier 1 · Key", "Tier 2 · Growth"])`   |
| Account Owner   | `pick(seed, ["Marco Bianchi", "Giulia Romano", "Luca Ferrari", "Sofia Conti"])` (Italian names list) |
| Customer since  | `2005 + (|hash| % 18)`                                                   |
| Employees       | `(5 + (|hash| % 95)) * 100`                                              |
| Annual revenue  | `(|hash| % 4500) + 200` (in MEUR)                                        |
| Open opps       | `(|hash| % 7) + 1`                                                       |
| Closed/Won YTD  | `round((customer.value / 1000) * 0.6)`                                   |
| Last activity   | `(|hash| % 14) + 1` days ago                                             |
| Phone           | `+39 0{(|hash|%9)+1} {1M + (|hash| % 8.999M)}`                          |

## 11.3 SAP material master synthesis

| Field            | Derivation                                                                          |
|------------------|-------------------------------------------------------------------------------------|
| Material number  | `PRY-{pick(["MV","HV","LV","OPT"])}-{(|hash| % 99999):05}`                          |
| Material type    | `pick(["FERT — Finished good", "HALB — Semi-finished", "ROH — Raw material"])`      |
| Material group   | `pick(["CBL-MV-EU", "CBL-HV-EU", "CBL-LV-EU", "OPT-FBR-EU", "ACC-MV-EU"])`         |
| Base UoM         | `pick(["KM", "M", "KG"])`                                                           |
| Standard price   | `(|hash| % 5000) + 500` (€ / UoM)                                                  |
| Moving avg price | `std_price + (hash%200 - 100)`                                                      |
| Plants           | Country-specific (Italy → `IT01 Pignataro Maggiore`, `IT02 Battipaglia`, `IT05 Livorno`) |
| Stock per plant  | `((|hash| + i*17) % 5000) + 100`                                                   |
| Lead time        | `(i+1) * 7` days                                                                    |
| Volume YTD       | `((|hash| % 1500) + 100) * 10`                                                     |

## 11.4 Competitor share synthesis

```python
tier   = 1 if "1" in detail else 2
base_share = 18 - i*2 if tier == 1 else 9 - i        # i = rank index in seed list
share = max(2, base_share + (1 if i%2==0 else -1))
trend = "up" if i%3==0 else "down" if i%3==1 else "flat"
```

In Phase 1, market share is sourced from external syndicated reports (e.g. CRU, S&P Platts) and momentum from rolling 90-day deal volume.

## 11.5 The labeling contract

The platform's contract is that any *synthetic* value is **clearly labeled** in the UI:

- "Demo view" footer in drill modals
- "Phase 1 unlocks…" hints
- "P2" chips on placeholder countries
- "demo: values unchanged, Phase 1 wires real BU split" helper text on filters

**No fake number is rendered as if it were real.** This is a deliberate design constraint to preserve trust during demos.

---

# 12. Compare page

![Compare view](manual-screenshots/14-compare.jpg)

Side-by-side comparison of up to 4 countries.

## 12.1 Country selector

5 countries with flag emojis. Click toggles in/out of the `selected` list (max 4). When at 4, others are disabled with `opacity-50 cursor-not-allowed`.

## 12.2 Per-country aggregates

For each country in `selected`:

```typescript
projectsCount(c)   = | gold.mining_projects WHERE country == c |
capex(c)           = Σ projects.capex_estimate_musd WHERE country == c
cable(c)           = Σ projects.cable_demand_estimate_km WHERE country == c
flagged(c)         = | projects WHERE country == c AND flagged_of_interest |
newsCount(c)       = | gold.news_curated WHERE c in countries |
topProjects(c)     = first 3 projects for c
recentNews(c)      = first 3 news for c
```

## 12.3 Header tiles

Navy gradient card per country: flag, name, focus tagline, "Country ID →" link to `/country/{id}`.

| Country     | Focus tagline                  |
|-------------|--------------------------------|
| Italy       | Cable manufacturing hub        |
| France      | Nuclear + grid investment      |
| Germany     | Energiewende leader            |
| Spain       | Renewable boom                 |
| Netherlands | Offshore wind                  |

## 12.4 Comparable metric rows (5 rows)

Each row: 220px label column + N equal-width value columns (where N = selected count).

| Metric                | Bar color  | Format         |
|-----------------------|------------|----------------|
| Mining projects       | green      | `XX projects`  |
| CAPEX exposure        | blue       | `$XXM` or `$X.Xk M` compact when ≥ 1000 |
| Cable demand est.     | amber      | `XX km` or compact |
| News mentions (30d)   | neutral    | `XX articles`  |
| Flagged of interest   | amber      | `XX flagged`   |

**Bar width** in the comparison rows is proportional to the max across selected countries:

```typescript
bar_width_pct(c, metric) = max(2, (metric(c) / max(metric(*selected))) * 100)
```

The `max(2, …)` ensures even zero values show a visible nub.

## 12.5 "Top signals per country" row

Per country, a card with:

- "Top projects" — first 3 from `gold.mining_projects` filtered by country
- "Recent news" — first 3 from `gold.news_curated` filtered by country

Both fall back to italic "No projects/news tracked" if empty.

## 12.6 Acceptance criteria — Compare

| AC-ID  | Criterion                                                                  |
|--------|----------------------------------------------------------------------------|
| CMP-1  | Selecting 5th country is blocked                                            |
| CMP-2  | Deselecting all shows empty-state card                                      |
| CMP-3  | Bar widths are relative to the max of selected (not global)                 |
| CMP-4  | Grid columns equal selected count (no empty columns when 1-2 selected)      |

---

# 13. Market Trends — chart logic

![Trends](manual-screenshots/15-trends.jpg)

## 13.1 Top controls

- **Country switcher** — segmented control for 5 EU countries; default Italy
- **Time range** — `12M / 24M / All` → clips series to last N points (12, 24, 999)

## 13.2 Time range clipping

```typescript
const points = RANGES.find(r => r.id == range).points;
const clipped = series.slice(Math.max(0, series.length - points));
```

## 13.3 Copper hero card

| Element              | Logic                                                            |
|----------------------|------------------------------------------------------------------|
| Latest value         | `series[-1].value` formatted as `$X,XXX`                         |
| Delta chip           | `((last - first) / first) * 100` % over the range                |
| Area chart           | Recharts `AreaChart`, green gradient (Prysmian green @ 35% → 2%) |
| Peak indicator       | red `ReferenceDot` at `(maxPeriod, max)`                         |
| AI annotation strip  | template with `maxPeriod` interpolated                           |

```typescript
const max = Math.max(...series.map(p => p.value));
const maxIdx = series.findIndex(p => p.value === max);
// ReferenceDot at series[maxIdx]
```

## 13.4 Indicator cards (4 macro indicators)

Per indicator (`construction_output`, `non_residential_market_output`, `residential_market_output`, `gdp`):

| Element       | Logic                                                            |
|---------------|------------------------------------------------------------------|
| Label         | `prettify(indicator_key)` — replaces `_` with space, title case  |
| Latest value  | `series[-1].value` with thousand separator                       |
| Delta chip    | `(last - first) / first * 100` over range                        |
| Sparkline     | 90px AreaChart, navy color                                       |
| AI footer     | `indicator.ai_insight_narrative` from gold (one-line)            |

## 13.5 Building permits bar chart

```sql
SELECT * FROM gold.market_trends
WHERE country = :country AND indicator = 'building_permits_ytd'
ORDER BY period;
```

Recharts `BarChart`, blue bars (`#2563EB`), rounded top corners. AI footer with the indicator's narrative.

## 13.6 Custom tooltip component

```typescript
function ChartTooltip({active, payload, label, suffix, mini}) {
  return active && payload?.length ? (
    <div className="bg-white border rounded-lg shadow-card px-3 py-2">
      <div className="text-[10px] text-ink-subtle font-mono">{label}</div>
      <div className="text-sm font-semibold tabular-nums">
        {payload[0].value.toLocaleString()}{suffix}
      </div>
    </div>
  ) : null;
}
```

Mini variant for sparklines (smaller padding).

## 13.7 Acceptance criteria — Trends

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| TRD-1    | Switching country reloads all charts under that country's data                            |
| TRD-2    | Switching range clips series and updates delta chip without full page refresh             |
| TRD-3    | Copper card peak dot matches the highest series value                                     |
| TRD-4    | Indicator cards each show their AI insight narrative when present                         |

---

# 14. Projects pipeline + detail

![Projects list](manual-screenshots/16-projects.jpg)

## 14.1 Top bar

- Page title with `total` and `filtered.length` counts
- **Refresh from sources** — triggers `POST /api/agents/mining_cable_specialist/run` (bounded: 3 items, 30s) and polls list every 8s

## 14.2 AI Insight callout

```
"{filtered.length} projects shown.
 Total CAPEX exposure: ${totalCapex:,}M.
 Estimated cable demand: {totalCable:,} km.
 {liveCount} new from last agent run."
```

## 14.3 Filter bar

| Filter            | Type            | Source                                          |
|-------------------|-----------------|-------------------------------------------------|
| Search            | text            | client-side filter on `name/owner/country/status` containing q |
| Country           | select          | `unique(items.country)` sorted alpha           |
| Status            | select          | `unique(items.status)` sorted alpha            |
| Owner             | select          | `unique(items.owner)` sorted alpha             |
| Flagged only      | toggle (star)   | filter `flagged_of_interest == true`           |
| Clear filters     | shows when `activeCount > 0`                                       |

The search and flagged filter are **client-side** (already-fetched data). Country/Status/Owner are passed as `/api/projects?country=X` query params (server-side) so the result set narrows.

## 14.4 Table

Columns:

| Column     | Source / format                                                  |
|------------|------------------------------------------------------------------|
| Project    | `name` (link to `/projects/{id}`) + `owner` sub + ⭐ if flagged   |
| Country    | `country`                                                        |
| Status     | colored badge per `StatusBadge` mapping                          |
| CAPEX      | `$XXXM` if `capex_estimate_musd` present                         |
| Capacity   | `XXX MW` if `capacity_mw` present                                |
| Cable km   | `XXX` (no unit, header shows "Cable km")                        |
| Years      | `start_year–end_year`                                            |
| Source     | `live` (green) or `seed` (neutral) badge + external link icon if `source_url` present |

### Status badge mapping

```typescript
const s = status.toLowerCase();
tone = s.includes("oper")  ? "green" :
       s.includes("constr") || s.includes("build") ? "blue" :
       s.includes("plan") || s.includes("explor")  ? "amber" : "neutral";
```

## 14.5 Project detail page

A drill-down screen at `/projects/{id}`:

| Block                  | Content                                                          |
|------------------------|------------------------------------------------------------------|
| Breadcrumb             | `Projects › {name}`                                              |
| Hero                   | Flagged badge, data source badge, project type badge; name (H1); owner/country/status sub-row; Evidence + Source action buttons |
| 4 KPI tiles            | CAPEX, Capacity, Cable demand, Lifecycle                         |
| Project timeline       | inferred milestones with colored dots (see §14.6)                |
| AI Insight card        | templated narrative (see §14.7)                                  |
| Evidence trail entry   | opens `EvidenceMetadataViewer` modal                             |
| Related news section   | news filtered by project country                                 |

## 14.6 Auto-built timeline

Rules in `buildTimeline(project)`:

1. **"Project announced"** at `start_year − 1` (always shown)
2. **"Permitting & construction start"** at `start_year` (if defined)
3. **Current state milestone:**
   - status contains "oper" or "prod" → "Operational" at `start_year + 2`
   - status contains "constr" or "build" → "Under construction"
   - else → "Future milestone"
4. **"Planned end of life"** at `end_year` (if defined)

Each milestone has a colored dot:
- announced → blue
- start → green or amber (depending on current status)
- operational → green
- under construction → blue
- future → faint
- end of life → faint

## 14.7 Project AI Insight

```python
def aiInsight(p):
    cap = f"${p.capex:,}M CAPEX" if p.capex else "undisclosed CAPEX"
    cable = f"~{p.cable:,} km of cable demand" if p.cable else "moderate cable exposure"
    flag = " Strategic relevance confirmed by domain expert review." if p.flagged else ""
    return (
        f"{p.name} represents {cap} in {p.country or 'the region'}, "
        f"with {cable} over its lifecycle. "
        f"{f'Current status — {p.status.lower()}.' if p.status else ''}"
        f"{flag} Cross-reference with related news indicates ongoing market momentum."
    )
```

## 14.8 Related news (project detail)

```sql
SELECT * FROM gold.news_curated
WHERE LOWER(:project_country) = ANY(LOWER(countries))
ORDER BY published_at DESC
LIMIT 5;
```

Simple country-match. Phase 1 will use entity-level matching (owner mentions, project name in title) for higher precision.

## 14.9 API surface — Projects

| Endpoint                   | Method | Query / Body                                          | Returns                       |
|----------------------------|--------|-------------------------------------------------------|-------------------------------|
| `/api/projects`            | GET    | `country?`, `status?`, `owner?`, `capex_min?`, `capacity_min?`, `start_year_min?`, `page`, `page_size` | `{ items[], total, page, page_size }` |
| `/api/projects/{id}`       | GET    | —                                                     | `MiningProject`                |
| `/api/agents/mining_cable_specialist/run` | POST | `{ bounded, max_items, timeout_seconds }` | `{ agent, status }`            |

## 14.10 Acceptance criteria — Projects

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| PRJ-1    | Filters compound (AND across all active filters)                                          |
| PRJ-2    | "Refresh from sources" triggers an agent run; loading state visible                       |
| PRJ-3    | Click row → navigate to project detail (no modal hijack)                                  |
| PRJ-4    | Detail page renders without project_type/start_year/end_year/capex (graceful nulls)       |
| PRJ-5    | Timeline shows at least 2 milestones for every project                                    |

---

# 15. Derived fields & confidence

## 15.1 News relevance score

Composite [0,1] computed by the News Finder agent:

```
relevance_score = 0.30 * taxonomy_match     +  # keyword overlap with config
                  0.25 * geo_relevance      +  # country match with subscribed regions
                  0.20 * source_authority   +  # weighted by source rank
                  0.15 * recency            +  # exponential decay over 30d
                  0.10 * embedding_proximity  # cosine with Prysmian topic vectors
```

The weights are **configurable per BU** (a country team may weight geo higher; the technology team may weight embedding higher).

### Sub-scores

| Sub-score             | Computation                                                   |
|-----------------------|---------------------------------------------------------------|
| taxonomy_match        | `|matched_keywords ∩ taxonomy| / |taxonomy|`                  |
| geo_relevance         | 1.0 if country in subscribed_regions, 0.5 if neighbor, 0.0 else |
| source_authority      | predefined per-source: mining.com = 0.9, Reuters = 1.0, blog = 0.5 |
| recency               | `exp(-days_since_published / 14)`                             |
| embedding_proximity   | `cosine(article_embedding, prysmian_topic_centroid)`          |

## 15.2 Cable demand estimate (mining projects)

Derived field — production target × cable intensity ratio per project type:

```python
INTENSITY = {  # km of cable per MW or per kt/year of production
    "copper":      {"per_year_kt": 0.08},   # 80m per kt/yr
    "lithium":     {"per_year_kt": 0.06},
    "nickel":      {"per_year_kt": 0.07},
    "data_center": {"per_mw":      0.40},   # 400m per MW
    "wind":        {"per_mw":      1.20},
    "solar":       {"per_mw":      0.50},
    "BESS":        {"per_mw":      0.30},
    "grid":        {"per_mw":      2.00},
}
```

Applied at silver → gold:

```python
if project_type == "data_center":
    cable_km = capacity_mw * INTENSITY["data_center"]["per_mw"]
elif project_type in ("copper", "lithium", "nickel"):
    cable_km = production_kt_per_yr * INTENSITY[project_type]["per_year_kt"]
elif project_type in ("wind", "solar", "BESS", "grid"):
    cable_km = capacity_mw * INTENSITY[project_type]["per_mw"]
# etc.
```

These ratios come from Prysmian's existing internal heuristics (Phase 0 input). They're tracked **as data**, not code, so MI team can adjust them without a deploy.

## 15.3 flagged_of_interest rule

A project is flagged iff:

```
flagged_of_interest = (
    cable_demand_estimate_km >= 100        # material exposure
    AND country in PRYSMIAN_PRIORITY_COUNTRIES
    AND status in {"planning", "construction"}  # actionable lifecycle
)
OR
    LLM_judgment(name+owner+description) == "strategic"  # AI-suggested
```

The LLM judgment is invoked only if the rule-based check fails — so it's a *secondary* signal.

`PRYSMIAN_PRIORITY_COUNTRIES` is configurable per quarter (currently: EU + UK + MENA core).

## 15.4 Composite confidence score (any AI output)

```
confidence = 0.4 * source_reliability   +  # publisher rank or system trust
             0.3 * extraction_certainty +  # LLM self-reported (with calibration)
             0.2 * consistency_check    +  # cross-source agreement
             0.1 * recency
```

Sub-scores are stored in `audit.evidence_metadata.confidence_breakdown` so the **Evidence bundle** modal can show *why* a confidence is high or low — not just the number.

### Calibration

LLM self-reported confidence is notoriously poorly calibrated. The pipeline applies a **calibration curve** learned from MI decisions:

```
calibrated_confidence = isotonic_regression(raw_confidence)
```

Curve refit weekly from `audit.review_decisions` (accept = label 1, reject = label 0).

## 15.5 Demo vs Phase 1 confidence

In the demo build, `confidence` is computed by:

```python
def _confidence(item_id: str) -> int:
    h = sum(ord(c) for c in str(item_id))
    return 65 + (h % 31)   # 65..95
```

Deterministic hash → integer in [65,95]. The composite formula above is the **Phase 1 implementation target**.

---

# 16. News & Reports page

![News](manual-screenshots/17-news.jpg)

## 16.1 List rendering

```sql
SELECT * FROM gold.news_curated
ORDER BY published_at DESC NULLS LAST
LIMIT :page_size OFFSET :offset;
```

With optional `?q=<text>`:

```sql
... WHERE title ILIKE '%q%' OR summary ILIKE '%q%' ...
```

Per article shown:

- Source · publication date (relative or absolute on hover)
- Title (link to source, opens in new tab)
- Summary (2 lines, line-clamp)
- Country chips · segment chips
- Relevance score chip (color band per §6.5)

## 16.2 API surface — News

| Endpoint              | Method | Query                              | Returns           |
|-----------------------|--------|------------------------------------|-------------------|
| `/api/news`           | GET    | `q?`, `page`, `page_size`          | `NewsItem[]`      |

## 16.3 Acceptance criteria — News

| AC-ID    | Criterion                                                                                |
|----------|------------------------------------------------------------------------------------------|
| NWS-1    | Articles sorted newest first                                                              |
| NWS-2    | `?q=copper` returns subset of unfiltered list                                             |
| NWS-3    | Link click opens source in new tab                                                       |

---

# 17. Evidence bundle

Across the platform, anywhere you see an **Evidence bundle** button (Review queue detail, Project detail, AI Insight cards), clicking it opens a modal showing:

- The **source URL(s)** the AI used
- The **retrieval log** (timestamp, query, agent name)
- The **confidence breakdown** by sub-factor
- The **prompt template** version used
- The **model** used (Sonnet / Haiku / etc) and agent version

This is the **audit trail** the EU AI Act requires — every AI output is traceable to its sources and reasoning.

## 17.1 Schema

```json
{
  "id": "uuid",
  "agent_name": "news_finder",
  "agent_version": "1.2.0",
  "prompt_template_id": "news_finder_v3",
  "model": "claude-sonnet-4-6",
  "source_urls": [
    "https://www.mining.com/copper-price-record-tariff/"
  ],
  "retrieval_log": [
    {"ts": "2026-05-13T14:32:01Z", "query": "RSS fetch", "status_code": 200, "bytes": 8421},
    {"ts": "2026-05-13T14:32:02Z", "action": "llm_extract", "tokens_in": 1240, "tokens_out": 320}
  ],
  "confidence_score": 0.87,
  "confidence_breakdown": {
    "source_reliability": 0.9,
    "extraction_certainty": 0.85,
    "consistency_check": 0.8,
    "recency": 0.95
  },
  "created_at": "2026-05-13T14:32:03Z"
}
```

## 17.2 What's intentionally NOT stored

- Raw chain-of-thought reasoning
- LLM internal tokens or embeddings
- User prompts that contain confidential queries (PII / classified data)

This is the safer audit pattern: provable but not regurgitating model internals.

---

# 18. API endpoint catalog (complete)

| Endpoint                                  | Method | Purpose                                          |
|-------------------------------------------|--------|--------------------------------------------------|
| `/api/health`                             | GET    | Liveness probe                                   |
| `/api/projects`                           | GET    | List projects with filters                       |
| `/api/projects/{id}`                      | GET    | Project detail                                   |
| `/api/news`                               | GET    | News list with optional search                   |
| `/api/trends/{country}`                   | GET    | Macro indicators + copper history                |
| `/api/countries`                          | GET    | List of countries available                       |
| `/api/countries/{id}/summary`             | GET    | 4-quadrant country data                          |
| `/api/agents/catalog`                     | GET    | All 6 agents with live status                    |
| `/api/agents/{name}/run`                  | POST   | Trigger bounded run                              |
| `/api/agents/{id}/toggle`                 | POST   | Pause/resume agent                               |
| `/api/agents/runs`                        | GET    | Last 50 audit runs                               |
| `/api/evidence/{id}`                      | GET    | Evidence bundle for an item                      |
| `/api/search?q=`                          | GET    | Global search (news + projects + countries)      |
| `/api/review/queue`                       | GET    | Review queue items by status                     |
| `/api/review/stats`                       | GET    | Counts by status                                 |
| `/api/review/{id}/decide`                 | POST   | Submit decision                                  |
| `/api/alerts`                             | GET    | Alerts list with filters                         |
| `/api/alerts/stats`                       | GET    | Counts by type/severity, unread                  |
| `/api/alerts/{id}/read`                   | POST   | Mark read/unread                                 |
| `/api/alerts/subscriptions`               | GET    | Get user preferences                             |
| `/api/alerts/subscriptions`               | PUT    | Update preferences (partial)                     |

## 18.1 Auth header (Phase 1)

All non-`/health` endpoints require:

```
Authorization: Bearer {jwt_from_entra}
```

Demo build does not enforce this.

## 18.2 Rate limits (Phase 1)

| Endpoint group       | Per user limit              |
|----------------------|-----------------------------|
| Read-only (GET)      | 600 req/min                 |
| Search               | 60 req/min                  |
| Decisions (POST)     | 120 req/min                 |
| Agent runs (POST)    | 10 req/min                  |

Enforced via Redis token bucket. Exceeding returns `429 Too Many Requests` with `Retry-After` header.

---

# 19. Data quality rules

## 19.1 Required fields per entity

| Entity             | Required to enter gold                                          |
|--------------------|----------------------------------------------------------------|
| NewsCurated        | source, url, title, relevance_score, evidence_id                |
| MiningProject      | name, country, project_type, status, evidence_id                |
| CountrySummary     | (computed from CSV — always 4 quadrants present)               |

Items missing required fields stay in silver and are flagged for MI review with `validation_status = 'incomplete'`.

## 19.2 Normalizations applied at silver

- **Country** → ISO-3166 long name (e.g., "Italy" not "IT" not "Italia")
- **URL** → canonicalized (strip UTM, sort query params, lowercase domain)
- **Currency** → USD millions for CAPEX (FX as-of `published_at`)
- **Capacity** → MW (not GW, not kW)
- **Dates** → ISO 8601 UTC

## 19.3 Deduplication

| Entity          | Dedupe key                                                    |
|-----------------|---------------------------------------------------------------|
| News            | canonical URL                                                  |
| Project         | `(name lowercased, owner lowercased, country)`                |
| Evidence        | `(agent_name, prompt_template_id, source_urls hashed)`        |

Window: 48 hours for news (allow re-fetch with updated content), 30 days for projects (in case of restatements).

## 19.4 Schema validation

Pydantic v2 models on every API ingress + JSON Schema on every agent output. Invalid payloads logged to `audit.validation_errors` with full original payload (in case of debugging) — retained 30 days.

---

# 20. Security model

## 20.1 Data classification

Every row in gold tables carries `data_classification`:

| Level         | Examples                                       | Access                     |
|---------------|------------------------------------------------|----------------------------|
| public        | News from public publishers                    | All authenticated users    |
| internal      | Mining projects, country summaries             | All MI Hub users           |
| confidential  | Salesforce account details, SAP material master | RBAC-scoped              |
| restricted    | Pricing details, contract specifics            | Need-to-know, audit logged |

## 20.2 PII handling

- News and projects do not contain PII (extraction strips personal names from summaries unless they are public-figure executives)
- Salesforce contacts (Phase 1) contain PII → routed through PII-aware processing (no LLM see PII unless explicitly invoked)
- Feedback text typed by MI is internal-only; not used as input to public-facing dashboards

## 20.3 Audit retention

| Audit table              | Retention                          |
|--------------------------|------------------------------------|
| audit.agent_runs         | 24 months online                   |
| audit.evidence_metadata  | 24 months online + 5 years archive |
| audit.review_decisions   | 5 years online (compliance)         |
| audit.validation_errors  | 30 days (debug)                     |

WORM (write-once read-many) via DB role permissions: agent service role has INSERT only, no UPDATE/DELETE.

## 20.4 LLM safety

- No customer PII sent to LLM provider (unless internally-hosted model)
- Prompt injection defenses: structured output schemas, allow-list filters on JSON
- Rate limiting per agent to bound cost (max tokens/run, max runs/day)
- Cost alerting when daily spend > 1.5× rolling 7-day average

---

# 21. Performance characteristics

## 21.1 SLAs (Phase 1)

| Operation                    | Target p95            |
|------------------------------|------------------------|
| Login → Dashboard render     | < 1.5s                 |
| Search palette response      | < 400ms                |
| Country ID page render       | < 2s                   |
| Project list (50 items)      | < 600ms                |
| Review queue accept submit   | < 300ms                |
| Agent run trigger ACK        | < 200ms (background runs separately) |

## 21.2 Capacity targets

| Resource              | Initial (Phase 1) | 12 months       |
|-----------------------|-------------------|------------------|
| Users (concurrent)    | 25                | 75               |
| News rows             | 50K               | 500K             |
| Project rows          | 1K                | 5K               |
| Daily agent runs      | 50                | 250              |
| LLM tokens/day        | 2M                | 10M              |

## 21.3 Cold start (free Render tier — demo only)

Services sleep after 15 min idle. First request after sleep → ≈30s warm-up. Once warm, normal latencies apply.

In Phase 1, services are always-on (Starter+ Render plans or containerized in Prysmian's cloud).

---

# 22. Utility & helper logic

## 22.1 Relative time formatter

```typescript
function relTime(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
```

Used everywhere that shows article ages, last run, decided_at, etc.

## 22.2 Greeting by hour

```typescript
function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
```

## 22.3 Initials extractor

```typescript
function initials(name) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
```

Used for SF account avatar and contact avatars.

## 22.4 Currency formatting

| Format        | Example       | When used                  |
|---------------|---------------|----------------------------|
| `$XXXM`       | `$4,500M`     | Project CAPEX              |
| `€XXX,XXX`    | `€150,000`    | Country summary values     |
| `€X.Xk`       | `€1.8k`       | Compact, large aggregates  |
| `€X.XM`       | `€2,643M`     | Annual revenue (SF panel)  |

Locale-aware via `toLocaleString()`.

---

# 23. Demo build vs Phase 1 production — full gap matrix

| Area                         | Demo build                                       | Phase 1 production                                  |
|------------------------------|--------------------------------------------------|-----------------------------------------------------|
| Auth                         | sessionStorage, any email                        | Azure Entra ID SSO + RBAC                           |
| DB                           | Postgres 16 + pgvector single instance           | Managed Postgres + replicas + pgvector / external vector |
| SAP ingestion                | None (synthetic in modal)                        | Live RFC calls (`BAPI_MATERIAL_GET_DETAIL`) cached  |
| Salesforce ingestion         | None (synthetic in modal)                        | Live REST `/sobjects/Account/{id}` cached            |
| Agents                       | 2 implemented, 4 catalog-only                    | All 6 implemented + scheduling cron / Airflow       |
| Agent runtime                | Single-process background tasks                  | Container-based, autoscaled queue consumers          |
| Review state                 | In-memory                                        | `audit.review_decisions` append-only table           |
| Alerts                       | Synthesized from data                            | KPI agent computes deltas live, alerts in stream    |
| Subscriptions                | In-memory single demo user                       | Per-user JSON in `users.preferences` + Teams/email routing |
| Newsletter                   | "Publish now" button                             | Editorial workflow + scheduled send via SendGrid/Mailchimp |
| Audit trail                  | Decisions only                                   | Full WORM log of all agent runs + decisions         |
| Confidence                   | Hash-based [65,95]                               | Composite formula §15.4 + isotonic calibration       |
| Embedding model              | Voyage-3-large (optional)                        | Voyage-3-large or org-internal model                 |
| LLM model                    | Claude Sonnet 4.6 + Haiku 4.5 fallback           | Same, with caching + batch API where appropriate    |
| Cost controls                | Bounded runs (max 3 items, 30s timeout)          | Token budget per agent run, daily cap                |
| Search                       | ILIKE substring                                  | Hybrid BM25 + vector + RRF rerank                   |
| Rate limits                  | None                                              | Redis token bucket per user                          |
| Monitoring                   | Render dashboard                                 | Datadog / New Relic + Sentry                         |
| Backup                       | Render auto                                      | PITR + nightly snapshot + cross-region replica       |
| Compliance reports           | —                                                | EU AI Act self-assessment quarterly                  |

---

# 24. Open questions for Phase 1

| Topic                       | Decision needed                                                  |
|-----------------------------|------------------------------------------------------------------|
| Vector store                | pgvector in Postgres or external (Qdrant, Pinecone)?             |
| Agent scheduling            | Airflow / Prefect / Render cron / Databricks Jobs?               |
| Newsletter delivery         | Mailchimp / SendGrid / internal SMTP?                            |
| Teams integration           | Microsoft Graph API or Power Automate?                            |
| Audit retention             | 12 months online / 5 years archive policy?                        |
| LLM provider                | Anthropic only or multi-provider (OpenAI fallback)?               |
| Embedding model             | Voyage cloud or org-hosted?                                       |
| Confidence calibration      | Quarterly re-tune or continuous online learning?                  |
| RBAC granularity            | Per-BU, per-country, per-document, per-row?                       |
| Data classification         | Confidential / Internal / Public on every row?                    |
| Newsletter content rights   | Can extracted summaries be re-published as Prysmian content?      |
| Cable intensity ratios      | Source authority — who signs them off, how often updated?         |
| Customer/Competitor lists   | Manual curation or auto-discovery via news?                       |
| HITL escalation             | What happens to items waiting > 48h?                              |

---

# 25. Glossary

| Term            | Meaning                                                              |
|-----------------|----------------------------------------------------------------------|
| BU              | Business Unit (I&C, Power Grid, …)                                  |
| HITL            | Human in the Loop                                                    |
| MI              | Market Intelligence (team and function)                              |
| SoW             | Share of Wallet — Prysmian sales / total customer spend              |
| White space     | Untapped market = market value − current sales                       |
| Evidence bundle | The audit-trail record produced for every AI output                  |
| Gold table      | UI-ready data table after normalization and enrichment               |
| Surfacing rule  | Threshold that decides whether an item enters Review Queue           |
| Cable intensity | km of cable estimated per MW or per kt/yr of production              |
| Tier 1 / Tier 2 | Customer/competitor strategic importance band                        |
| Sonnet / Haiku  | Claude model sizes (Sonnet = primary, Haiku = fast fallback)         |
| BAPI            | SAP function module (Business Application Programming Interface)     |
| RBAC            | Role-Based Access Control                                            |
| WORM            | Write-Once Read-Many (immutable storage)                             |
| RRF             | Reciprocal Rank Fusion (search rerank technique)                     |

---

*EY for Prysmian Group — Functional Analysis · May 2026*
