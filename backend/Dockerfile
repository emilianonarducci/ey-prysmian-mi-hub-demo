FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml /app/
RUN uv pip install --system --no-cache .
COPY backend /app/backend
COPY agents /app/agents
COPY data /app/data
COPY scripts /app/scripts
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
