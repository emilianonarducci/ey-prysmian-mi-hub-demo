"""Idempotent init: run migrations + seed if empty.

Designed to be safe to re-run on every container boot (Render).
"""
import os
import sys
import time
from pathlib import Path

import psycopg
from sqlalchemy import text

REPO_ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS = REPO_ROOT / "data" / "migrations"


def _conn_kwargs():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Render-style DATABASE_URL
        return {"conninfo": db_url}
    return {
        "host": os.getenv("POSTGRES_HOST", "postgres"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "dbname": os.getenv("POSTGRES_DB", "mi_hub"),
    }


def wait_for_db(max_wait_s: int = 60):
    deadline = time.time() + max_wait_s
    while time.time() < deadline:
        try:
            with psycopg.connect(**_conn_kwargs(), connect_timeout=3) as c:
                c.execute("SELECT 1")
                return
        except Exception as e:
            print(f"[init_db] waiting for db... ({e})", flush=True)
            time.sleep(2)
    raise RuntimeError("DB not reachable")


def already_initialized() -> bool:
    try:
        with psycopg.connect(**_conn_kwargs()) as c:
            cur = c.execute("""
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.schemata WHERE schema_name = 'gold'
                )
            """)
            return bool(cur.fetchone()[0])
    except Exception:
        return False


def run_migrations():
    files = sorted(MIGRATIONS.glob("*.sql"))
    if not files:
        print("[init_db] no migrations found", flush=True)
        return
    with psycopg.connect(**_conn_kwargs(), autocommit=True) as c:
        for f in files:
            sql = f.read_text()
            print(f"[init_db] applying {f.name}", flush=True)
            try:
                c.execute(sql)
            except Exception as e:
                print(f"[init_db] migration {f.name} error (continuing if already applied): {e}", flush=True)


def has_seed_data() -> bool:
    try:
        with psycopg.connect(**_conn_kwargs()) as c:
            cur = c.execute("SELECT COUNT(*) FROM gold.mining_projects")
            return cur.fetchone()[0] > 0
    except Exception:
        return False


def run_seed():
    # Import here so SQLAlchemy uses env vars set above
    sys.path.insert(0, str(REPO_ROOT))
    try:
        from scripts.seed_demo_data import seed_projects, seed_news, seed_trends, seed_indicators
        from backend.db.connection import SessionLocal
    except ImportError as e:
        # Some seed helpers may be optional
        print(f"[init_db] seed import partial: {e}", flush=True)
        from scripts.seed_demo_data import seed_projects, seed_news
        from backend.db.connection import SessionLocal
        seed_trends = None
        seed_indicators = None

    db = SessionLocal()
    try:
        print("[init_db] seeding projects + news...", flush=True)
        seed_projects(db)
        seed_news(db)
        if seed_indicators:
            try: seed_indicators(db)
            except Exception as e: print(f"[init_db] indicators seed skipped: {e}", flush=True)
        if seed_trends:
            try: seed_trends(db)
            except Exception as e: print(f"[init_db] trends seed skipped: {e}", flush=True)
        print("[init_db] seed done", flush=True)
    finally:
        db.close()


def main():
    print("[init_db] starting", flush=True)
    wait_for_db()
    if not already_initialized():
        print("[init_db] running migrations (gold schema absent)", flush=True)
        run_migrations()
    else:
        print("[init_db] gold schema exists, skipping migrations", flush=True)
    if not has_seed_data():
        print("[init_db] empty tables — seeding", flush=True)
        run_seed()
    else:
        print("[init_db] data present, skipping seed", flush=True)
    print("[init_db] done", flush=True)


if __name__ == "__main__":
    main()
