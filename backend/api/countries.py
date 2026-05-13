from fastapi import APIRouter, HTTPException
from pathlib import Path
import csv
from backend.schemas.countries import CountrySummary

router = APIRouter(prefix="/countries", tags=["countries"])

@router.get("", response_model=list[str])
def list_countries():
    return ["Italy", "France", "Germany", "UK", "Spain"]

@router.get("/{country_id}/summary", response_model=CountrySummary)
def country_summary(country_id: str):
    if country_id.lower() != "italy":
        raise HTTPException(404, "Country seed only available for Italy in demo")
    path = Path("/app/data/bronze/seed/country_italy_seed.csv")
    sbc, sbp, comp, mvbc = [], [], [], []
    with path.open() as f:
        for row in csv.DictReader(f):
            t = row["metric"]
            item = {"name": row["customer_or_product"], "value": float(row["value_eur"]) if row["value_eur"] else None, "detail": row["detail"]}
            if t == "sales_by_customer": sbc.append(item)
            elif t == "sales_by_product": sbp.append(item)
            elif t == "competitor": comp.append(item)
            elif t == "market_value_by_customer": mvbc.append(item)
    return CountrySummary(country="Italy", sales_by_customer=sbc, sales_by_product=sbp,
                          competitors=comp, market_value_by_customer=mvbc)
