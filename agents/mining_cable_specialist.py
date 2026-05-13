"""Mining Cable Specialist: extracts mining projects + tracks copper."""
import json, time
from datetime import datetime, timezone
from sqlalchemy import text
from anthropic.types import TextBlock
from backend.db.connection import SessionLocal
from agents.base import BaseAgent, AgentRunResult
from agents.llm.client import call_claude
from agents.tools.estimate import estimate_cable_demand_km
from agents.tools.commodity_query import get_latest_copper_and_deviation
from data.bronze.ingest_mining_com_rss import fetch_and_ingest as ingest_mining
from data.bronze.ingest_westmetall_copper import fetch_live_then_seed as ingest_copper
from data.silver.news_clean import transform_news

with open("/app/agents/llm/prompts/mining_specialist_v1.md") as f:
    SYSTEM_PROMPT = f.read()

class MiningCableSpecialistAgent(BaseAgent):
    name = "mining_cable_specialist"
    version = "0.1.0"
    description = "Extracts mining projects + tracks copper"
    prompt_version = "mining_specialist_v1"

    def run(self, bounded: bool = True, max_items: int = 5, timeout_seconds: int = 60) -> AgentRunResult:
        run_id = self.start_run({"bounded": bounded, "max_items": max_items, "timeout_seconds": timeout_seconds})
        started = datetime.now(timezone.utc)
        t0 = time.time()
        tokens_in_total = 0; tokens_out_total = 0; items_written = 0
        status = "running"
        try:
            try: ingest_mining(max_items=20)
            except Exception as e: print(f"[Mining] Mining.com ingest warning: {e}")
            try: ingest_copper()
            except Exception as e: print(f"[Mining] Copper ingest warning: {e}")
            try: transform_news()
            except Exception as e: print(f"[Mining] Silver warning: {e}")

            # 1. Commodity indicator writeback (copper) — uses tool
            copper = get_latest_copper_and_deviation()
            tool_calls = [{"name": "get_latest_copper_and_deviation", "input": {}, "output": copper}]
            if copper.get("latest_usd"):
                completed = datetime.now(timezone.utc)
                evidence_id = self.write_evidence(
                    run_id=run_id, source_urls=["westmetall://copper"],
                    source_snapshots=[json.dumps(copper)],
                    tool_calls=tool_calls,
                    retrieved_context=[],
                    structured_output=copper,
                    validation_checks={"has_value": True, "samples_min_5": copper["samples"] >= 5},
                    confidence_summary=f"Latest copper {copper['latest_usd']} USD/tonne; deviation {copper['deviation_pct']}% from rolling avg.",
                    started_at=started, completed_at=completed,
                    latency_ms=int((completed - started).total_seconds() * 1000), tokens_used=0,
                )
                db = SessionLocal()
                try:
                    db.execute(text("""
                        INSERT INTO gold.commodity_indicators (metal, value_usd, unit, observed_at, deviation_pct, evidence_id, data_source_label)
                        VALUES ('copper', :v, 'USD/tonne', :ts, :dev, :eid, 'live')
                        ON CONFLICT (metal, observed_at) DO NOTHING
                    """), {"v": copper["latest_usd"], "ts": copper["observed_at"], "dev": copper["deviation_pct"], "eid": evidence_id})
                    db.commit()
                finally:
                    db.close()
                items_written += 1

            # 2. Extract mining projects from silver.news_clean
            db = SessionLocal()
            try:
                rows = db.execute(text("""
                    SELECT s.id, s.source, s.url, s.title, s.summary
                    FROM silver.news_clean s
                    LEFT JOIN gold.mining_projects g ON g.source_url = s.url
                    WHERE g.id IS NULL
                      AND (s.title ILIKE '%mine%' OR s.title ILIKE '%mining%'
                           OR s.title ILIKE '%copper%' OR s.title ILIKE '%lithium%'
                           OR s.title ILIKE '%project%' OR s.summary ILIKE '%mining%')
                    ORDER BY s.published_at DESC NULLS LAST
                    LIMIT :n
                """), {"n": max_items}).all()
            finally:
                db.close()

            for r in rows:
                if time.time() - t0 > timeout_seconds:
                    status = "fallback_used"; break
                content = f"Title: {r.title}\n\nSummary: {r.summary or ''}"
                msg = call_claude(
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": f"Extract project entity from article:\n\n{content}\n\nReturn ONLY JSON."}],
                    max_tokens=512, temperature=0.1,
                )
                tokens_in_total += msg.usage.input_tokens
                tokens_out_total += msg.usage.output_tokens
                raw = msg.content[0].text if msg.content and isinstance(msg.content[0], TextBlock) else "{}"
                if raw.startswith("```"):
                    raw = raw.split("```")[1].lstrip("json").strip()
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if not parsed.get("name") or parsed.get("is_project") is False:
                    continue
                cable_km = estimate_cable_demand_km(parsed.get("capacity_mw"), parsed.get("project_type"))
                validation_checks = {
                    "has_name": bool(parsed.get("name")),
                    "valid_status": parsed.get("status") in [None, "planning", "construction", "operational", "on_hold", "cancelled"],
                    "cable_estimated": cable_km is not None,
                }
                completed = datetime.now(timezone.utc)
                evidence_id = self.write_evidence(
                    run_id=run_id, source_urls=[r.url],
                    source_snapshots=[content[:5000]],
                    tool_calls=[{"name": "estimate_cable_demand_km", "input": {"capacity_mw": parsed.get("capacity_mw"), "project_type": parsed.get("project_type")}, "output": cable_km}],
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
                        INSERT INTO gold.mining_projects
                          (name, owner, country, project_type, capex_estimate_musd, capacity_mw,
                           start_year, end_year, cable_demand_estimate_km, status, source_url, evidence_id, data_source_label)
                        VALUES (:name, :owner, :country, :ptype, :capex, :cap, :sy, :ey, :ckm, :st, :url, :eid, 'live')
                    """), {
                        "name": parsed["name"], "owner": parsed.get("owner"),
                        "country": parsed.get("country"), "ptype": parsed.get("project_type"),
                        "capex": parsed.get("capex_estimate_musd"), "cap": parsed.get("capacity_mw"),
                        "sy": parsed.get("start_year"), "ey": parsed.get("end_year"),
                        "ckm": cable_km, "st": parsed.get("status"),
                        "url": r.url, "eid": evidence_id,
                    })
                    db.commit()
                finally:
                    db.close()
                items_written += 1

            if status == "running": status = "success"
        except Exception as e:
            status = "failed"
            self.complete_run(run_id, status, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total, str(e))
            raise
        self.complete_run(run_id, status, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total)
        return AgentRunResult(run_id, status, items_written, int((time.time() - t0) * 1000), tokens_in_total, tokens_out_total)
