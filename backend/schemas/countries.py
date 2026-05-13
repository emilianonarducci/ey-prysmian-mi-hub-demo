from pydantic import BaseModel

class CountrySummary(BaseModel):
    country: str
    sales_by_customer: list[dict]
    sales_by_product: list[dict]
    competitors: list[dict]
    market_value_by_customer: list[dict]
