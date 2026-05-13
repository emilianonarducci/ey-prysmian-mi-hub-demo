from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal

class TrendPoint(BaseModel):
    period: date
    value: Decimal | None

class IndicatorSeries(BaseModel):
    indicator: str
    series: list[TrendPoint]
    ai_insight_narrative: str | None
    data_source_label: str

class TrendsCountryOut(BaseModel):
    country: str
    indicators: list[IndicatorSeries]
    copper_history: list[TrendPoint]
