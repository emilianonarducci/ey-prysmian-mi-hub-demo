# scripts/seed_demo_data.py
"""Seed gold tables with deterministic demo data from CSV files."""
import csv
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.db.connection import SessionLocal
from backend.db.models import MiningProject, NewsCurated, CommodityIndicator, MarketTrend

SEED_DIR = Path("/app/data/bronze/seed")

def seed_projects(db: Session):
    db.execute(text("TRUNCATE gold.mining_projects RESTART IDENTITY CASCADE"))
    with (SEED_DIR / "projects_seed.csv").open() as f:
        for row in csv.DictReader(f):
            db.add(MiningProject(
                name=row["name"], owner=row["owner"], country=row["country"],
                project_type=row["project_type"],
                capex_estimate_musd=float(row["capex_estimate_musd"]) if row["capex_estimate_musd"] else None,
                capacity_mw=float(row["capacity_mw"]) if row["capacity_mw"] else None,
                start_year=int(row["start_year"]) if row["start_year"] else None,
                end_year=int(row["end_year"]) if row["end_year"] else None,
                cable_demand_estimate_km=float(row["cable_demand_estimate_km"]) if row["cable_demand_estimate_km"] else None,
                status=row["status"], source_url=row["source_url"],
                data_source_label="seed",
            ))
    db.commit()

def seed_news(db: Session):
    db.execute(text("TRUNCATE gold.news_curated RESTART IDENTITY CASCADE"))
    with (SEED_DIR / "news_seed.csv").open() as f:
        for row in csv.DictReader(f):
            db.add(NewsCurated(
                source=row["source"], url=row["url"], title=row["title"],
                summary=row["summary"],
                relevance_score=float(row["relevance_score"]),
                segments=row["segments"].split(",") if row["segments"] else [],
                countries=row["countries"].split(",") if row["countries"] else [],
                published_at=datetime.fromisoformat(row["published_at"].replace("Z", "+00:00")),
                data_source_label="seed",
            ))
    db.commit()

def seed_copper(db: Session):
    db.execute(text("TRUNCATE gold.commodity_indicators RESTART IDENTITY CASCADE"))
    with (SEED_DIR / "copper_history_seed.csv").open() as f:
        for row in csv.DictReader(f):
            db.add(CommodityIndicator(
                metal="copper",
                value_usd=float(row["value_usd_per_tonne"]),
                unit="USD/tonne",
                observed_at=datetime.fromisoformat(row["observed_date"]).replace(tzinfo=timezone.utc),
                data_source_label="seed",
            ))
    db.commit()

def seed_market_trends(db: Session):
    db.execute(text("TRUNCATE gold.market_trends RESTART IDENTITY CASCADE"))
    # Synthetic Italy trends 2017-2026
    italy_trends = [
        ("construction_output", [(y, 95 + (y - 2017) * 1.5) for y in range(2017, 2027)]),
        ("non_residential_market_output", [(y, 88 + (y - 2017) * 1.8) for y in range(2017, 2027)]),
        ("gdp", [(y, 100 + (y - 2017) * 0.8) for y in range(2017, 2027)]),
        ("residential_market_output", [(y, 92 + (y - 2017) * -0.4) for y in range(2017, 2027)]),
    ]
    insights = {
        "construction_output": "Construction output stable through 2024 with modest 1.5% YoY growth expected through 2026.",
        "non_residential_market_output": "Non-residential output outperforming national average, +1.8% YoY trajectory.",
        "gdp": "Italy GDP modest growth 0.8% YoY; construction sector underperforming.",
        "residential_market_output": "Residential market under pressure -0.4% YoY through 2026 forecast.",
    }
    for indicator, points in italy_trends:
        for year, value in points:
            db.add(MarketTrend(
                country="Italy", indicator=indicator,
                period=datetime(year, 1, 1),
                value=value, ai_insight_narrative=insights[indicator],
                data_source_label="seed",
            ))
    # Quarterly building permits Italy
    permits = [("2022", "Q1", 1200), ("2022", "Q2", 1180), ("2022", "Q3", 1150), ("2022", "Q4", 1100),
               ("2023", "Q1", 1080), ("2023", "Q2", 1050), ("2023", "Q3", 980), ("2023", "Q4", 920),
               ("2024", "Q1", 880), ("2024", "Q2", 850)]
    for year, q, value in permits:
        month = {"Q1":1, "Q2":4, "Q3":7, "Q4":10}[q]
        db.add(MarketTrend(
            country="Italy", indicator="building_permits_ytd",
            period=datetime(int(year), month, 1), value=value,
            ai_insight_narrative="Building permits down 4.3% YoY through Q1 2026.",
            data_source_label="seed",
        ))
    db.commit()

def main():
    db = SessionLocal()
    try:
        seed_projects(db)
        seed_news(db)
        seed_copper(db)
        seed_market_trends(db)
        print("Seed loaded:")
        print(f"  mining_projects: {db.query(MiningProject).count()}")
        print(f"  news_curated: {db.query(NewsCurated).count()}")
        print(f"  commodity_indicators: {db.query(CommodityIndicator).count()}")
        print(f"  market_trends: {db.query(MarketTrend).count()}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
