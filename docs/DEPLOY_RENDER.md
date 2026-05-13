# Deploy to Render.com

End-to-end deployment of the MI Hub demo to Render: managed Postgres + FastAPI API + Vite/nginx frontend.

## What gets provisioned

| Service      | Type             | Plan (default) | Notes                                   |
|--------------|------------------|----------------|-----------------------------------------|
| `mi-hub-db`  | Postgres 16      | Free (90 days) | pgvector enabled via init migration     |
| `mi-hub-api` | Web (Docker)     | Free           | FastAPI on uvicorn, 2 workers           |
| `mi-hub-web` | Web (Docker)     | Free           | Vite build → nginx static               |

> Free-plan services **sleep after 15 min idle** and take ~30s to wake. For a live demo, upgrade `mi-hub-api` and `mi-hub-web` to Starter ($7/mo each) — Postgres can stay free for 90 days.

## Step-by-step

### 1. Push to GitHub

```bash
cd ~/dev/ey-prysmian-mi-hub-demo
git remote add origin git@github.com:<your-user>/ey-prysmian-mi-hub-demo.git
git push -u origin main
```

> The repo must be **private** if you don't want the demo seed data and config exposed publicly. `.env` is gitignored, so no secrets leak.

### 2. Create Render Blueprint

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Connect your GitHub repo `ey-prysmian-mi-hub-demo`
3. Render reads `render.yaml` → click **Apply**
4. Wait ~3-5 min for DB + 2 web services to provision

### 3. Set the Anthropic API key

On `mi-hub-api` service → **Environment** tab → set:

| Key                  | Value                                      |
|----------------------|--------------------------------------------|
| `ANTHROPIC_API_KEY`  | `sk-ant-api03-...` (your real key)         |

The service will redeploy automatically.

### 4. Wire the frontend to the backend

Once `mi-hub-api` is **Live**, copy its public URL (e.g. `https://mi-hub-api.onrender.com`).

On `mi-hub-web` service → **Environment** → set:

| Key             | Value                                |
|-----------------|--------------------------------------|
| `VITE_API_BASE` | `https://mi-hub-api.onrender.com`    |

Then **Manual Deploy** → **Clear build cache & deploy** so Vite rebuilds the bundle with the right backend URL baked in.

### 5. (Optional) Lock CORS

On `mi-hub-api` → **Environment** → set:

| Key             | Value                                |
|-----------------|--------------------------------------|
| `CORS_ORIGINS`  | `https://mi-hub-web.onrender.com`    |

The default regex already accepts any `*.onrender.com`, so this is just hardening.

### 6. Verify

- `https://mi-hub-api.onrender.com/api/health` → `{"status":"ok"}`
- `https://mi-hub-api.onrender.com/api/projects?page_size=1` → JSON with seeded projects
- `https://mi-hub-web.onrender.com/` → login screen (any email + password works in demo)

## What happens on first boot

`backend/Dockerfile.prod` runs `python -m scripts.init_db` before uvicorn. The script is **idempotent**:

1. Wait for DB to accept connections (up to 60s)
2. If `gold` schema doesn't exist → apply `data/migrations/*.sql` in order
3. If `gold.mining_projects` is empty → seed projects + news + indicators + trends from CSV
4. Otherwise skip — safe to redeploy without losing data

## Updating after deploy

- Push to `main` → both web services auto-rebuild (`autoDeploy: true`)
- DB schema changes: add a new `data/migrations/00N_*.sql` file and the init script picks it up
- Secrets: change in Render dashboard, service redeploys

## Troubleshooting

- **Cold start ≈ 30s** on free plan. First request after idle wakes the dyno.
- **"Service unavailable" on first deploy**: wait for the green "Live" badge — DB needs to finish provisioning before the API boots.
- **CORS errors in browser**: confirm `CORS_ORIGINS` or that the frontend domain ends in `.onrender.com` (regex match).
- **Agents not running**: agents are triggered manually via `/api/agents/{name}/run` or via the AI Agents page. Background workers are not deployed in this blueprint (would need a Render Background Worker service @ $7/mo).
- **Build OOM on free plan**: free plan has 512MB RAM. The Vite build uses ~400MB — should fit, but if it fails, bump `mi-hub-web` to Starter.

## Cost summary

| Tier            | Postgres | API    | Web    | Total       |
|-----------------|----------|--------|--------|-------------|
| Free (90 days)  | $0       | $0     | $0     | $0          |
| Starter (always-on) | $7   | $7     | $7     | **$21/mo**  |
| + Background worker (agents always-on) | +$7 | | | **$28/mo** |

The demo doesn't need always-on — wake-on-request is fine for vendor presentations.
