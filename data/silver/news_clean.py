"""Transform bronze.news_raw → silver.news_clean (dedup, normalize, embed)."""
from sqlalchemy import text
from backend.db.connection import SessionLocal
from agents.llm.client import embed_text

def transform_news() -> int:
    db = SessionLocal()
    inserted = 0
    try:
        # Find bronze rows not yet in silver
        rows = db.execute(text("""
            SELECT b.id, b.source, b.url, b.url_hash, b.title, b.raw_summary, b.published_at
            FROM bronze.news_raw b
            LEFT JOIN silver.news_clean s ON s.bronze_id = b.id
            WHERE s.id IS NULL
            ORDER BY b.published_at DESC
            LIMIT 100
        """)).all()
        for r in rows:
            title_summary = f"{r.title}\n{r.raw_summary or ''}"
            embedding = embed_text(title_summary[:2000])
            db.execute(text("""
                INSERT INTO silver.news_clean (bronze_id, source, url, url_hash, title, summary, published_at, language, embedding, cleaned_at)
                VALUES (:bronze_id, :source, :url, :url_hash, :title, :summary, :published_at, 'en', :embedding, NOW())
                ON CONFLICT (url_hash) DO NOTHING
            """), {
                "bronze_id": r.id, "source": r.source, "url": r.url, "url_hash": r.url_hash,
                "title": r.title, "summary": (r.raw_summary or "")[:2000], "published_at": r.published_at,
                "embedding": str(embedding) if embedding else None,
            })
            inserted += 1
        db.commit()
    finally:
        db.close()
    return inserted

if __name__ == "__main__":
    n = transform_news()
    print(f"Transformed {n} news items to silver")
