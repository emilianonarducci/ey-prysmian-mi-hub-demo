"""Tool: latest LME copper + deviation."""
from sqlalchemy import text
from backend.db.connection import SessionLocal

def get_latest_copper_and_deviation() -> dict:
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT value_usd, observed_at
            FROM bronze.commodity_raw
            WHERE metal = 'copper'
            ORDER BY observed_at DESC
            LIMIT 30
        """)).all()
        if not rows:
            return {"latest_usd": None, "deviation_pct": None, "samples": 0}
        latest = float(rows[0].value_usd)
        avg = sum(float(r.value_usd) for r in rows) / len(rows)
        deviation_pct = round((latest - avg) / avg * 100, 2) if avg else 0
        return {"latest_usd": latest, "observed_at": rows[0].observed_at.isoformat(),
                "rolling_avg_usd": round(avg, 2), "deviation_pct": deviation_pct, "samples": len(rows)}
    finally:
        db.close()
