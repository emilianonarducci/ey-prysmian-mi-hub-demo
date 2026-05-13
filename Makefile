.PHONY: up down seed agent-news agent-mining agent reset clean logs help

help:
	@echo "Targets:"
	@echo "  up           - Build + start all 4 services"
	@echo "  down         - Stop services (keep volumes)"
	@echo "  reset        - Stop, remove volumes, rebuild"
	@echo "  clean        - Stop, remove volumes + local images"
	@echo "  seed         - Populate gold tables with deterministic demo data"
	@echo "  agent-news   - Run NewsFinder agent (bounded)"
	@echo "  agent-mining - Run MiningCableSpecialist agent (bounded)"
	@echo "  agent        - Run both agents in sequence"
	@echo "  logs         - Tail logs from all services"

up:
	docker compose up -d --build
	@echo "Waiting for postgres..."
	@until docker compose exec -T postgres pg_isready -U mihub >/dev/null 2>&1; do sleep 1; done
	@echo "All services up. Frontend: http://localhost:3015  API docs: http://localhost:8000/docs"

down:
	docker compose down

seed:
	docker compose exec api python -m scripts.seed_demo_data

agent-news:
	docker compose exec api python -m scripts.run_agent news_finder

agent-mining:
	docker compose exec api python -m scripts.run_agent mining_cable_specialist

agent: agent-news agent-mining

reset:
	docker compose down -v
	docker compose up -d --build

clean:
	docker compose down -v --rmi local

logs:
	docker compose logs -f --tail=100
