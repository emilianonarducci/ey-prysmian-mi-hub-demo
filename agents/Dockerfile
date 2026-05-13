FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml /app/
RUN uv pip install --system --no-cache .
COPY agents /app/agents
COPY data /app/data
COPY scripts /app/scripts
COPY backend /app/backend
CMD ["python", "-c", "import time; print('agent-worker idle - use scripts/run_agent.py or API trigger'); time.sleep(86400)"]
