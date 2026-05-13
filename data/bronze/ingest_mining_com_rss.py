"""Ingest mining.com RSS into bronze.news_raw (idempotent, hash-dedup)."""
import hashlib, json
from datetime import datetime, timezone
import feedparser
from sqlalchemy import text
from backend.db.connection import SessionLocal

FEED_URL = "https://www.mining.com/feed/"
SOURCE = "mining.com"

def fetch_and_ingest(timeout: int = 10, max_items: int = 50) -> int:
    feed = feedparser.parse(FEED_URL)
    inserted = 0
    db = SessionLocal()
    try:
        for entry in feed.entries[:max_items]:
            url = entry.get("link", "")
            url_hash = hashlib.sha256(url.encode()).hexdigest()
            existing = db.execute(text("SELECT 1 FROM bronze.news_raw WHERE url_hash = :h"),
                                   {"h": url_hash}).first()
            if existing: continue
            published = entry.get("published_parsed")
            published_at = datetime(*published[:6], tzinfo=timezone.utc) if published else None
            db.execute(text("""
                INSERT INTO bronze.news_raw (source, url, url_hash, title, raw_summary, raw_content, published_at, raw_payload)
                VALUES (:source, :url, :url_hash, :title, :summary, :content, :published_at, :payload)
            """), {
                "source": SOURCE, "url": url, "url_hash": url_hash,
                "title": entry.get("title", ""),
                "summary": entry.get("summary", "")[:5000],
                "content": (entry.get("content", [{}])[0].get("value", "") if entry.get("content") else "")[:10000],
                "published_at": published_at,
                "payload": json.dumps({k: str(v)[:500] for k, v in entry.items()})
            })
            inserted += 1
        db.commit()
    finally:
        db.close()
    return inserted

if __name__ == "__main__":
    n = fetch_and_ingest()
    print(f"Inserted {n} new mining.com items")
