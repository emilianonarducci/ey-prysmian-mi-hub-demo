"""CLI: python -m scripts.run_agent <agent_name>"""
import sys
from agents.news_finder import NewsFinderAgent
from agents.mining_cable_specialist import MiningCableSpecialistAgent

REGISTRY = {
    "news_finder": NewsFinderAgent,
    "mining_cable_specialist": MiningCableSpecialistAgent,
}

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python -m scripts.run_agent <{'|'.join(REGISTRY)}>")
        sys.exit(1)
    name = sys.argv[1]
    if name not in REGISTRY:
        print(f"Unknown agent: {name}"); sys.exit(1)
    agent = REGISTRY[name]()
    result = agent.run(bounded=True, max_items=5, timeout_seconds=60)
    print(f"Run {result.run_id} status={result.status} items={result.items_written} latency_ms={result.latency_ms}")

if __name__ == "__main__":
    main()
