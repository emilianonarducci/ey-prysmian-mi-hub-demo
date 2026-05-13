"""Cable demand estimation heuristic. Placeholder values — NOT Prysmian commercial estimates."""
TYPOLOGY_KM_PER_MW = {
    "copper": 1.7, "lithium": 1.6, "iron_ore": 1.5, "nickel": 1.8,
    "cobalt": 1.5, "rare_earth": 1.5, "diamond": 1.4, "tungsten": 1.5,
    "graphite": 1.4, "default": 1.5,
}

def estimate_cable_demand_km(capacity_mw: float | None, project_type: str | None) -> float | None:
    if capacity_mw is None:
        return None
    factor = TYPOLOGY_KM_PER_MW.get((project_type or "default").lower(), TYPOLOGY_KM_PER_MW["default"])
    return round(capacity_mw * factor, 1)
