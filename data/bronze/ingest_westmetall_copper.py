"""Ingest Westmetall LME copper into bronze.commodity_raw. Falls back to seed CSV."""
import csv
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import text
from backend.db.connection import SessionLocal

SEED_PATH = Path("/app/data/bronze/seed/copper_history_seed.csv")

def ingest_from_seed() -> int:
    inserted = 0
    db = SessionLocal()
    try:
        with SEED_PATH.open() as f:
            for row in csv.DictReader(f):
                observed = datetime.fromisoformat(row["observed_date"]).replace(tzinfo=timezone.utc)
                db.execute(text("""
                    INSERT INTO bronze.commodity_raw (metal, source, value_usd, unit, observed_at)
                    VALUES ('copper', 'westmetall_seed', :v, 'USD/tonne', :ts)
                    ON CONFLICT (metal, source, observed_at) DO NOTHING
                """), {"v": float(row["value_usd_per_tonne"]), "ts": observed})
                inserted += 1
        db.commit()
    finally:
        db.close()
    return inserted

def fetch_live_then_seed() -> int:
    """Try live Westmetall fetch (Phase 1 implementation); fall back to seed."""
    # Demo: always falls back to seed (avoids fragile scraping)
    return ingest_from_seed()

if __name__ == "__main__":
    n = fetch_live_then_seed()
    print(f"Ingested {n} copper rows (seed fallback used)")
