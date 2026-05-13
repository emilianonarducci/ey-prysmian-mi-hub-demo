"""Tool: compute simple keyword-based fallback relevance score."""
KEYWORDS = {
    "copper": 0.25, "cable": 0.30, "grid": 0.20, "lithium": 0.20,
    "data center": 0.20, "data centre": 0.20, "renewables": 0.15,
    "mining": 0.20, "critical mineral": 0.25, "sustainability": 0.10,
    "telecom": 0.15, "energy": 0.10, "capex": 0.10, "infrastructure": 0.10,
    "europe": 0.10, "italy": 0.10, "germany": 0.10,
}

def score_fallback(text: str) -> float:
    tl = text.lower()
    s = sum(w for k, w in KEYWORDS.items() if k in tl)
    return min(1.0, s)
