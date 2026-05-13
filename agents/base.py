"""Agent Bricks-style abstraction. Bounded run with timeout + fallback + evidence metadata."""
import hashlib, json, time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4
from sqlalchemy import text
from backend.db.connection import SessionLocal

@dataclass
class Tool:
    name: str
    description: str
    input_schema: dict
    func: Callable[..., Any]

@dataclass
class AgentRunResult:
    run_id: str
    status: str  # success | failed | fallback_used
    items_written: int
    latency_ms: int
    tokens_input: int
    tokens_output: int

class BaseAgent:
    name: str = "base"
    version: str = "0.1.0"
    description: str = ""
    prompt_version: str = "v1"
    model_id: str = "claude-sonnet-4-6"

    def __init__(self):
        self.tools: list[Tool] = []

    def register_tool(self, tool: Tool) -> None:
        self.tools.append(tool)

    def tool_specs(self) -> list[dict]:
        """Convert tools to Anthropic tool-use format."""
        return [
            {"name": t.name, "description": t.description, "input_schema": t.input_schema}
            for t in self.tools
        ]

    def find_tool(self, name: str) -> Tool | None:
        return next((t for t in self.tools if t.name == name), None)

    def run(self, bounded: bool = True, max_items: int = 5, timeout_seconds: int = 60) -> AgentRunResult:
        """Implemented by subclasses. Must write to gold + audit."""
        raise NotImplementedError

    def start_run(self, bounded_params: dict) -> str:
        db = SessionLocal()
        try:
            run_id = uuid4()
            db.execute(text("""
                INSERT INTO audit.agent_runs (id, agent_name, agent_version, status, bounded_params)
                VALUES (:id, :name, :ver, 'running', :params)
            """), {"id": run_id, "name": self.name, "ver": self.version, "params": json.dumps(bounded_params)})
            db.commit()
            return str(run_id)
        finally:
            db.close()

    def complete_run(self, run_id: str, status: str, latency_ms: int, tokens_input: int, tokens_output: int, error: str | None = None) -> None:
        db = SessionLocal()
        try:
            db.execute(text("""
                UPDATE audit.agent_runs
                SET status = :status, completed_at = NOW(), latency_ms = :ms,
                    tokens_input = :tin, tokens_output = :tout, error_message = :err
                WHERE id = :id
            """), {"status": status, "ms": latency_ms, "tin": tokens_input, "tout": tokens_output, "err": error, "id": run_id})
            db.commit()
        finally:
            db.close()

    def write_evidence(
        self,
        run_id: str,
        source_urls: list[str],
        source_snapshots: list[str],  # raw content snapshots
        tool_calls: list[dict],
        retrieved_context: list[dict],
        structured_output: dict,
        validation_checks: dict,
        confidence_summary: str,
        started_at: datetime,
        completed_at: datetime,
        latency_ms: int,
        tokens_used: int,
    ) -> str:
        """Write evidence_metadata row. Returns evidence_id."""
        snapshots_hash = [hashlib.sha256(s.encode()).hexdigest() for s in source_snapshots]
        db = SessionLocal()
        try:
            evidence_id = uuid4()
            db.execute(text("""
                INSERT INTO audit.evidence_metadata
                  (id, agent_run_id, agent_name, agent_version, prompt_version, model_id,
                   source_urls, source_snapshots_hash, tool_calls, retrieved_context,
                   structured_output, validation_checks, confidence_summary,
                   started_at, completed_at, latency_ms, tokens_used)
                VALUES (:id, :run_id, :name, :ver, :pver, :mid,
                        :urls, :hashes, :tc, :rc, :so, :vc, :cs,
                        :sa, :ca, :ms, :tu)
            """), {
                "id": evidence_id, "run_id": run_id, "name": self.name, "ver": self.version,
                "pver": self.prompt_version, "mid": self.model_id,
                "urls": source_urls, "hashes": snapshots_hash,
                "tc": json.dumps(tool_calls), "rc": json.dumps(retrieved_context),
                "so": json.dumps(structured_output), "vc": json.dumps(validation_checks),
                "cs": confidence_summary,
                "sa": started_at, "ca": completed_at,
                "ms": latency_ms, "tu": tokens_used,
            })
            db.commit()
            return str(evidence_id)
        finally:
            db.close()
