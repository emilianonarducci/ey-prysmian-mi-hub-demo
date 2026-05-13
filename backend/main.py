from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import health, projects, news, trends, countries, agents

app = FastAPI(title="EY Prysmian MI Hub Demo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(trends.router, prefix="/api")
app.include_router(countries.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
