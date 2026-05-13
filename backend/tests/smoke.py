from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_projects():
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert "items" in r.json()


def test_list_news():
    r = client.get("/api/news")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_trends_italy():
    r = client.get("/api/trends/Italy")
    assert r.status_code == 200
    assert r.json()["country"] == "Italy"


def test_country_summary_italy():
    r = client.get("/api/countries/italy/summary")
    assert r.status_code == 200
    assert r.json()["country"] == "Italy"
