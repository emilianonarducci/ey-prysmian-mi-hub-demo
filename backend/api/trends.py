from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.db.connection import get_db
from backend.db.models import MarketTrend, CommodityIndicator
from backend.schemas.trends import TrendsCountryOut, IndicatorSeries, TrendPoint

router = APIRouter(prefix="/trends", tags=["trends"])

@router.get("/{country}", response_model=TrendsCountryOut)
def trends_country(country: str, db: Session = Depends(get_db)):
    rows = db.execute(
        select(MarketTrend).where(MarketTrend.country == country).order_by(MarketTrend.period)
    ).scalars().all()
    by_indicator: dict[str, IndicatorSeries] = {}
    for r in rows:
        if r.indicator not in by_indicator:
            by_indicator[r.indicator] = IndicatorSeries(
                indicator=r.indicator, series=[], ai_insight_narrative=r.ai_insight_narrative,
                data_source_label=r.data_source_label
            )
        period_val = r.period.date() if hasattr(r.period, 'date') else r.period
        by_indicator[r.indicator].series.append(TrendPoint(period=period_val, value=r.value))
    copper = db.execute(
        select(CommodityIndicator).where(CommodityIndicator.metal == "copper").order_by(CommodityIndicator.observed_at)
    ).scalars().all()
    copper_history = [TrendPoint(period=c.observed_at.date(), value=c.value_usd) for c in copper]
    return TrendsCountryOut(country=country, indicators=list(by_indicator.values()), copper_history=copper_history)
