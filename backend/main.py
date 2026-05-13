from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import health, projects, news, trends, countries, agents, evidence, search

app = FastAPI(title="EY Prysmian MI Hub Demo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(health.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(trends.router, prefix="/api")
app.include_router(countries.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(search.router, prefix="/api")
