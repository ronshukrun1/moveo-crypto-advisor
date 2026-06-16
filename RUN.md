# Run Guide

Operational instructions for running the Moveo Crypto Advisor project locally.

## Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **Docker** and **Docker Compose**
- **Git**

PostgreSQL runs in Docker; a globally installed PostgreSQL server is not required.

---

## Environment Setup

### 1. Copy environment templates

From `backend/`:

```bash
cp ../.env.docker.example ../.env.docker
cp .env.example .env
```

From the repository root (equivalent):

```bash
cp .env.docker.example .env.docker
cp backend/.env.example backend/.env
```

### 2. Edit local files

Replace placeholder values in `.env.docker` and `backend/.env`. **Never commit** these files.

| File | Purpose |
|------|---------|
| `.env.docker` | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` |
| `backend/.env` | Application, database connection, JWT, and external API credentials |

### Backend environment variables (names only)

| Category | Variables |
|----------|-----------|
| Application | `PORT`, `NODE_ENV`, `FRONTEND_URL` |
| PostgreSQL | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| CoinGecko | `COINGECKO_BASE_URL`, `COINGECKO_API_KEY`, `COINGECKO_TIMEOUT_MS` |
| NewsData | `NEWSDATA_BASE_URL`, `NEWSDATA_API_KEY`, `NEWSDATA_TIMEOUT_MS` |
| OpenRouter | `OPENROUTER_BASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_MS` |
| Imgflip | `IMGFLIP_BASE_URL`, `IMGFLIP_USERNAME`, `IMGFLIP_PASSWORD`, `IMGFLIP_TEMPLATE_ID`, `IMGFLIP_TIMEOUT_MS` |
| Cache | `MARKET_CACHE_TTL_SECONDS`, `NEWS_CACHE_TTL_SECONDS`, `MARKET_STALE_TTL_SECONDS`, `NEWS_STALE_TTL_SECONDS` |

### Port alignment

`DB_PORT` in `backend/.env` must match the host port in `.env.docker` (`POSTGRES_PORT`). The provided examples use **5433** when host port 5432 is already in use.

---

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend (optional, scaffold only)

```bash
cd frontend
cp .env.example .env
npm install
npm test
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | NestJS API base URL (must include `/api`, e.g. `http://localhost:3000/api`) |

### Root (orchestration scripts)

```bash
npm install
```

---

## Start PostgreSQL

From the **repository root**:

```bash
docker compose --env-file .env.docker up -d
docker compose ps
```

Wait until the `postgres` service is **healthy**.

---

## Database Migrations

From `backend/`:

```bash
npm run migration:run
npm run migration:show
```

Other migration commands:

```bash
npm run migration:revert
npm run migration:create -- src/database/migrations/MigrationName
npm run migration:generate -- src/database/migrations/MigrationName
```

Migrations are **not** applied automatically at startup (`migrationsRun: false`, `synchronize: false`).

The latest migration adds `daily_insights` and `daily_memes` for per-user UTC-day persistence of AI insight and meme content.

---

## Start the Backend

From `backend/`:

```bash
npm run start:dev
```

Other modes:

```bash
npm run start        # single run
npm run start:prod   # production build output
```

### Local URLs

| Resource | URL |
|----------|-----|
| API base | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |

### Start frontend dev server (optional)

From `frontend/`:

```bash
npm run dev
```

Default Vite URL: http://localhost:5173 (must match `FRONTEND_URL` in `backend/.env` for CORS).

After login, users with `onboardingCompleted=false` are redirected to `/onboarding` to complete the three-step setup (`GET /api/coins`, then `POST /api/onboarding`). Incomplete step state is kept in memory only and resets on page refresh before submission.

Copy `frontend/.env.example` to `frontend/.env` before starting. If `VITE_API_BASE_URL` is missing or wrong, the app fails at startup or the API status indicator shows **unavailable**.

### Start both from root

```bash
npm run dev
```

---

## Stop and Reset

### Stop PostgreSQL (keep data)

From the repository root:

```bash
docker compose down
```

### Remove PostgreSQL container and delete all data

**Warning: this permanently deletes the Docker volume and all local database data.**

```bash
docker compose down -v
```

---

## Build, Lint, Test, and Audit

### Backend only (from `backend/`)

```bash
npm run build
npm run lint
npm test
npm run test:e2e
npm audit
```

E2E tests require Docker PostgreSQL to be running with migrations applied. External APIs are mocked in tests.

### Full project (from repository root)

```bash
npm run build
npm run lint
npm run test
```

### Manual stale-fallback check (optional)

After the backend is running with valid provider credentials:

1. Call `GET /api/market` and `GET /api/news?limit=5` successfully to populate fresh and stale caches.
2. Wait for fresh TTL expiry, or temporarily lower `MARKET_CACHE_TTL_SECONDS` / `NEWS_CACHE_TTL_SECONDS` locally.
3. Trigger a controlled provider failure (e.g. invalid timeout simulation in a dev-only setup) **without committing invalid credentials**.
4. Confirm standalone endpoints still return last-known mapped data (no `isStale` in response).
5. Confirm `GET /api/dashboard` returns `market.isStale: true` and/or `news.isStale: true` when fallback is used.
6. Restart the backend and repeat the failure request — stale fallback should be unavailable until a new successful provider response.

Record only status codes, whether stale fallback was used, dashboard `isStale`, restart behavior, and timing. Do not record secrets or raw provider responses. Restore valid local configuration after testing.

---

## Common Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Backend fails at startup with environment validation errors | Missing or invalid `.env` values | Compare `backend/.env` with `backend/.env.example` |
| Database connection refused | PostgreSQL not running or wrong port | `docker compose ps`; align `DB_PORT` and `POSTGRES_PORT` |
| Migrations fail | Database not ready or wrong credentials | Restart Docker; verify `.env.docker` matches `backend/.env` DB settings |
| E2E tests fail | Migrations not applied or Docker down | `npm run migration:run`; `docker compose up -d` |
| `409` on `/api/dashboard` | Onboarding not completed | `POST /api/onboarding` first |
| `502` / `503` / `504` on content routes | External API key, rate limit, or timeout | Verify provider credentials in `backend/.env` |
| CORS errors from browser | `FRONTEND_URL` mismatch | Set `FRONTEND_URL` to the actual frontend origin (e.g. `http://localhost:5173`) |
| Frontend API status unavailable | Wrong `VITE_API_BASE_URL` | Use `http://localhost:3000/api` (include `/api` prefix); ensure backend is running |
| Frontend fails at startup | Missing `VITE_API_BASE_URL` | Copy `frontend/.env.example` to `frontend/.env` |

---

## Suggested Postman Flow

1. `GET /api/health`
2. `POST /api/auth/register`
3. `POST /api/auth/login` — save `accessToken`
4. `GET /api/auth/me`
5. `GET /api/coins`
6. `POST /api/onboarding`
7. `GET /api/preferences`
8. `GET /api/selected-coins`
9. `GET /api/market`
10. `GET /api/news` (optional: `?limit=5`)
11. `GET /api/insights/daily`
12. `GET /api/memes/daily`
13. `GET /api/dashboard`

Protected requests:

```http
Authorization: Bearer <accessToken>
```

In Swagger (`/api/docs`), click **Authorize** and paste the **raw** `accessToken` only — Swagger UI adds the `Bearer` prefix automatically.

Do not store real passwords, tokens, or API keys in shared collections.
