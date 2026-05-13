"""News Finder agent: curates newsletter from silver.news_clean using Claude."""
import json, time
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import text
from anthropic.types import TextBlock, ToolUseBlock
from backend.db.connection import SessionLocal
from agents.base import BaseAgent, AgentRunResult
from agents.llm.client import call_claude
from agents.tools.relevance_score import score_fallback
from data.bronze.ingest_mining_com_rss import fetch_and_ingest as ingest_mining
from data.bronze.ingest_europacable_rss import fetch_and_ingest as ingest_europacable
from data.silver.news_clean import transform_news

with open("/app/agents/llm/prompts/news_finder_v1.md") as f:
    SYSTEM_PROMPT = f.read()

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "relevance_score": {"type": "number"},
        "segments": {"type": "array", "items": {"type": "string"}},
        "countries": {"type": "array", "items": {"type": "string"}},
        "confidence_summary": {"type": "string"},
    },
    "required": ["summary", "relevance_score", "segments", "countries", "confidence_summary"]
}

class NewsFinderAgent(BaseAgent):
    name = "news_finder"
    version = "0.1.0"
    description = "Generic newsletter generation from cable/energy/telecom news"
    prompt_version = "news_finder_v1"

    def run(self, bounded: bool = True, max_items: int = 5, timeout_seconds: int = 30) -> AgentRunResult:
        run_id = self.start_run({"bounded": bounded, "max_items": max_items, "timeout_seconds": timeout_seconds})
        started = datetime.now(timezone.utc)
        t0 = time.time()
        tokens_in_total = 0
        tokens_out_total = 0
        items_written = 0
        status = "running"
        try:
            # 1. Ingest fresh news (bounded). If fails, proceed with whatever's in silver.
            try:
                ingest_mining(max_items=20)
                ingest_europacable(max_items=20)
            except Exception as e:
                print(f"[NewsFinder] Ingest warning: {e}")
            try:
                transform_news()
            except Exception as e:
                print(f"[NewsFinder] Silver transform warning: {e}")

            # 2. Pick top candidates from silver
            db = SessionLocal()
            try:
                rows = db.execute(text("""
                    SELECT s.id, s.source, s.url, s.title, s.summary, s.published_at
                    FROM silver.news_clean s
                    LEFT JOIN gold.news_curated g ON g.url = s.url
                    WHERE g.id IS NULL
                    ORDER BY s.published_at DESC NULLS LAST
                    LIMIT :n
                """), {"n": max_items}).all()
            finally:
                db.close()

            # 3. For each, call Claude to compute relevance + summary
            for r in rows:
                if time.time() - t0 > timeout_seconds:
                    status = "fallback_used"
                    break
                tool_calls = []
                content = f"Title: {r.title}\n\nSummary: {r.summary or ''}"
                msg = call_claude(
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": f"Analyze this article and return JSON matching the schema.\n\n{content}\n\nReturn ONLY valid JSON, no markdown fences."}],
                    max_tokens=512, temperature=0.1,
                )
                tokens_in_total += msg.usage.input_tokens
                tokens_out_total += msg.usage.output_tokens
                raw = msg.content[0].text if msg.content and isinstance(msg.content[0], TextBlock) else "{}"
                # Strip code fences if any
                if raw.startswith("```"):
                    raw = raw.split("```")[1].lstrip("json").strip()
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    parsed = {
                        "summary": (r.summary or r.title)[:200],
                        "relevance_score": score_fallback(content),
                        "segments": [], "countries": [],
                        "confidence_summary": "Fallback used: LLM response was not valid JSON."
                    }
                # Validation
                validation_checks = {
                    "json_parsed": True,
                    "relevance_in_range": 0.0 <= float(parsed.get("relevance_score", 0)) <= 1.0,
                }
                # Write evidence + gold row
                completed = datetime.now(timezone.utc)
                evidence_id = self.write_evidence(
                    run_id=run_id,
                    source_urls=[r.url],
                    source_snapshots=[content[:5000]],
                    tool_calls=tool_calls,
                    retrieved_context=[{"silver_id": str(r.id), "title": r.title}],
                    structured_output=parsed,
                    validation_checks=validation_checks,
                    confidence_summary=parsed.get("confidence_summary", ""),
                    started_at=started, completed_at=completed,
                    latency_ms=int((completed - started).total_seconds() * 1000),
                    tokens_used=msg.usage.input_tokens + msg.usage.output_tokens,
                )
                db = SessionLocal()
                try:
                    db.execute(text("""
                        INSERT INTO gold.news_curated
                          (source, url, title, summary, relevance_score, segments, countries, published_at, evidence_id, data_source_label)
                        VALUES (:source, :url, :title, :summary, :rs, :seg, :cou, :pub, :eid, 'live')
                        ON CONFLICT (url) DO NOTHING
                    """), {
                        "source": r.source, "url": r.url, "title": r.title,
                        "summary": parsed["summary"], "rs": parsed["relevance_score"],
                        "seg": parsed.get("segments", []), "cou": parsed.get("countries", []),
                        "pub": r.published_at, "eid": evidence_id,
                    })
                    db.commit()
                finally:
                    db.close()
                items_written += 1

            if status == "running":
                status = "success"
        except Exception as e:
            status = "failed"
            self.complete_run(run_id, status, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total, str(e))
            raise
        self.complete_run(run_id, status, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total)
        return AgentRunResult(run_id, status, items_written, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total)
