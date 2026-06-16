# AI Interactions Log

This file documents AI-assisted development stages for the Moveo Crypto Advisor project.

---

## Stage Entry Template

### Stage: [Stage Name]

**Date:** YYYY-MM-DD

**Prompt summary:**

[Short summary of the general idea and main requirements for the stage.]

**Response summary:**

[What was planned and implemented.]

**Main decisions:**

- [Key decision]

**Files created or modified:**

- `path/to/file`

**Commands and tests:**

- `command` — Pass / Fail — [brief note]

**Unresolved issues:**

- [Issue, or "None"]

---

## Stage 1: Project Skeleton

**Date:** 2026-06-15

**Prompt summary:**

Set up the initial monorepo skeleton with separate NestJS backend and React/Vite frontend apps, shared root dev scripts, `.gitignore`, safe `.env.example` files, and AI documentation. No business features, database, auth, or deployment tooling. A follow-up pass addressed lint and root audit issues.

**Response summary:**

Scaffolded backend and frontend, added root orchestration with `concurrently`, environment examples, and this log. Cleanup fixed a backend bootstrap lint warning and resolved root `npm audit` findings via a `shell-quote` override.

**Main decisions:**

- Minimal root `package.json` with shared scripts; MUI and Axios deferred
- Strict TypeScript scaffolds; `README.md` left unchanged
- Bootstrap failures handled with `.catch()` and non-zero exit
- `shell-quote` patched via npm `overrides` without upgrading `concurrently`

**Files created or modified:**

- Created: `package.json`, `package-lock.json`, `.gitignore`, `backend/`, `frontend/`, `backend/.env.example`, `frontend/.env.example`, `docs/ai-interactions.md`
- Modified: `backend/src/main.ts`, `package.json`, `package-lock.json`

**Commands and tests:**

- Scaffold and install — Pass
- `backend`: build, lint, test, audit — Pass (lint clean after cleanup)
- `frontend`: build, lint, audit — Pass
- `root`: build, lint, test, audit — Pass

**Unresolved issues:**

- None

---

## Stage 2: PostgreSQL and TypeORM Foundation

**Date:** 2026-06-15

**Prompt summary:**

Add PostgreSQL and TypeORM foundation to the NestJS backend: env validation, shared TypeORM config, migration workflow, and Docker Compose for local development. No business entities, auth, Swagger, or frontend changes.

**Response summary:**

Added Docker Compose PostgreSQL, validated environment configuration, shared TypeORM setup with migrations disabled at startup, migration npm scripts, and env validation unit tests. Verified DB connectivity via Docker health check, `migration:show`, and NestJS startup.

**Main decisions:**

- Docker Compose for local PostgreSQL only; backend/frontend not containerized
- Single source of truth for env validation and `buildTypeOrmOptions()`
- `synchronize: false`, `migrationsRun: false`, empty entities array
- `ConfigService.getOrThrow()` at runtime; CLI `DataSource` reuses same config
- Migration CLI uses `TS_NODE_PROJECT=tsconfig.typeorm.json`

**Files created or modified:**

- Created: `docker-compose.yml`, `.env.docker.example`, `backend/src/config/*`, `backend/src/database/*`, `backend/tsconfig.typeorm.json`
- Modified: `backend/package.json`, `backend/package-lock.json`, `backend/.env.example`, `backend/src/app.module.ts`, `backend/src/main.ts`, `.gitignore`, `docs/ai-interactions.md`

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `backend`: migration:show, build, lint, test, audit, start — Pass
- `root`: build, lint, test — Pass
- `docker compose down` — Pass (volume preserved)

**Unresolved issues:**

- If host port `5432` is in use, align `POSTGRES_PORT` and `DB_PORT` in local env files
- `npm run test:e2e` not updated for database dependency

---

## Stage 3: Backend Foundation

**Date:** 2026-06-15

**Prompt summary:**

Add shared NestJS backend foundation: global `/api` prefix, ValidationPipe, CORS from `FRONTEND_URL`, Swagger at `/api/docs`, health endpoint with DB check, global exception filter, and tests. No auth or business features.

**Response summary:**

Implemented shared app setup, health module, global validation/error handling, Swagger, and CORS. Removed default scaffold controller. Added unit and E2E tests for health, validation, and error formatting.

**Main decisions:**

- `configureApplication()` shared by runtime and E2E; Swagger initialized only in `main.ts`
- ValidationPipe rejects unknown fields with 400; explicit `@Type()` for query transformation
- CORS uses validated `FRONTEND_URL` only; no wildcard or credentials
- Health check uses `SELECT 1`; 503 preserves safe `database.status` via exception filter
- No global success-response wrapper

**Files created or modified:**

- Created: `backend/src/app.setup.ts`, `backend/src/common/filters/*`, `backend/src/health/*`, `backend/test/health.e2e-spec.ts`, `backend/test/validation.e2e-spec.ts`, `backend/test/setup-e2e-env.ts`
- Modified: `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/config/*`, `backend/.env.example`, `backend/package.json`, `backend/test/jest-e2e.json`, `docs/ai-interactions.md`
- Removed: `backend/src/app.controller.ts`, `backend/src/app.service.ts`, `backend/src/app.controller.spec.ts`, `backend/test/app.e2e-spec.ts`

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `backend`: build, lint, test (12), test:e2e (4), audit — Pass
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E tests require running PostgreSQL via Docker Compose
- If host port `5432` is occupied, align `POSTGRES_PORT` and `DB_PORT` in local env files

---

## Stage 4: Authentication and Users

**Date:** 2026-06-15

**Prompt summary:**

Implement user persistence, registration, login, JWT authentication, and `GET /api/auth/me` with the first real database migration, Swagger docs, validation, and tests.

**Response summary:**

Added `User` entity and migration, `UsersModule` and `AuthModule` with bcrypt password hashing, JWT Passport guard/strategy, register/login/me endpoints, and unit plus E2E coverage.

**Main decisions:**

- **bcrypt** (12 salt rounds) for password hashing — widely used, actively maintained, built-in salt
- Registration and login kept separate; JWT payload `{ sub, email }` only
- Email normalized to lowercase; duplicate email returns 409 (including race-condition handling)
- `passwordHash` never exposed in API or Swagger responses
- `/api/auth/me` resolves user by JWT `sub`; returns 404 if user no longer exists

**Files created or modified:**

- Created: `backend/src/users/*`, `backend/src/auth/*`, `backend/src/database/migrations/1749998400000-CreateUsersTable.ts`, `backend/test/auth.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/database/typeorm.config.ts`, `backend/src/config/*`, `backend/.env.example`, `backend/test/setup-e2e-env.ts`, `docs/ai-interactions.md`
- Removed: `backend/src/app.controller.ts`, `backend/src/app.service.ts`, `backend/src/app.controller.spec.ts`, `backend/test/app.e2e-spec.ts`

**Dependencies added:**

- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@types/passport-jwt`, `@types/bcrypt`

**Migration created:**

- `1749998400000-CreateUsersTable.ts` — `users` table with unique email constraint

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `migration:show` / `migration:run` / `migration:revert` / `migration:run` — Pass
- `backend`: build, lint, test (19), test:e2e (13), audit — Pass
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E and migrations require Docker PostgreSQL
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 5: Coins Entity and Coins Module

**Date:** 2026-06-15

**Prompt summary:**

Implement the internal cryptocurrency catalog with `Coin` entity, migration with six seeded coins, `CoinsModule`, public `GET /api/coins`, service lookup methods, Swagger, and tests.

**Response summary:**

Added `coins` table and migration seeding six supported assets, `CoinsModule` with repository-based service, public list endpoint returning mapped DTOs, and unit/E2E tests.

**Main decisions:**

- Initial coins inserted via migration (no separate seed framework)
- Active coins sorted alphabetically by `name` for stable, user-friendly ordering
- Response DTO excludes `isActive`, `createdAt`, `updatedAt`
- `findByIds()` returns active coins only for future onboarding validation

**Files created or modified:**

- Created: `backend/src/coins/*`, `backend/src/database/migrations/1750000000000-CreateCoinsTable.ts`, `backend/test/coins.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/database/typeorm.config.ts`, `docs/ai-interactions.md`

**Migration created:**

- `1750000000000-CreateCoinsTable.ts` — creates `coins` table and inserts BTC, ETH, SOL, XRP, DOGE, ADA

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `migration:show` / `run` / `revert` / `run` — Pass
- `backend`: build, lint, test (24), test:e2e (14), audit — Pass
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 6: User Preferences Entity and Module

**Date:** 2026-06-15

**Prompt summary:**

Implement authenticated user content preferences with `UserPreference` entity, one-to-one user relation, migration, protected `GET`/`PATCH /api/preferences`, validation, Swagger, and tests.

**Response summary:**

Added `user_preferences` table with PostgreSQL enum for investor profile, lazy default creation on first read, partial PATCH updates, JWT-protected endpoints, and unit/E2E coverage.

**Main decisions:**

- PostgreSQL native enum `investor_profile_enum` for `investorProfile`
- Lazy creation on first `GET /api/preferences` with default BEGINNER + all content flags true
- Unique `userId` FK to `users` with `ON DELETE CASCADE`
- Identity always from JWT; `userId` never accepted from client
- E2E tests run with `--runInBand` to avoid shared-database race conditions

**Files created or modified:**

- Created: `backend/src/preferences/*`, `backend/src/database/migrations/1750100000000-CreateUserPreferencesTable.ts`, `backend/test/preferences.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/database/typeorm.config.ts`, `backend/package.json`, `docs/ai-interactions.md`

**Migration created:**

- `1750100000000-CreateUserPreferencesTable.ts` — `user_preferences` table, enum, unique `userId`, FK cascade

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `migration:show` / `run` / `revert` / `run` — Pass
- `backend`: build, lint, test (30), test:e2e (21), audit — Pass
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 7: User Selected Coins

**Date:** 2026-06-15

**Prompt summary:**

Implement authenticated user selected cryptocurrency list with `user_selected_coins` join table, migration, protected `GET`/`PUT /api/selected-coins`, validation, Swagger, and tests.

**Response summary:**

Added explicit `UserSelectedCoin` entity with composite primary key, atomic full-replacement updates in a transaction, active-coin validation via `CoinsService`, and JWT-protected endpoints with unit/E2E coverage.

**Main decisions:**

- Dedicated `UserSelectedCoin` entity to expose `createdAt` on the join table
- Composite primary key on `(userId, coinId)` with `ON DELETE CASCADE` on both FKs
- `PUT` performs full replacement inside a TypeORM transaction; empty `coinIds` clears all selections
- Coin validation reuses `CoinsService.findByIds`; invalid/inactive IDs fail before any DB writes
- Response reuses `CoinItemDto` shape from coins module; join-table fields excluded
- Identity always from JWT; `userId` never accepted from client

**Files created or modified:**

- Created: `backend/src/selected-coins/*`, `backend/src/database/migrations/1750200000000-CreateUserSelectedCoinsTable.ts`, `backend/test/selected-coins.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/database/typeorm.config.ts`, `docs/ai-interactions.md`

**Migration created:**

- `1750200000000-CreateUserSelectedCoinsTable.ts` — `user_selected_coins` table, composite PK, cascade FKs

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `migration:show` / `run` / `revert` / `run` — Pass
- `backend`: build, lint, test (37), test:e2e (33), audit — Pass
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 8: Onboarding Orchestration

**Date:** 2026-06-15

**Prompt summary:**

Implement one authenticated `POST /api/onboarding` flow that atomically saves preferences, replaces selected coins, and sets `onboardingCompleted = true`, with validation, Swagger, and tests.

**Response summary:**

Added `OnboardingModule` that orchestrates existing preferences, selected-coins, and users logic inside a single TypeORM transaction, with transaction-aware helper methods on existing services.

**Main decisions:**

- No new migration — existing `users`, `user_preferences`, and `user_selected_coins` tables already support onboarding
- Coin validation runs before the transaction; invalid/inactive IDs never write to the database
- Transaction steps: verify user → upsert preferences → replace selected coins → set `onboardingCompleted = true`
- Repeated onboarding allowed — replaces prior choices and keeps `onboardingCompleted = true`
- Onboarding response preferences omit `id` and timestamps; selected coins reuse `CoinItemDto`

**Files created or modified:**

- Created: `backend/src/onboarding/*`, `backend/test/onboarding.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/preferences/preferences.service.ts`, `backend/src/selected-coins/selected-coins.service.ts`, `backend/src/selected-coins/selected-coins.module.ts`, `backend/src/users/users.service.ts`, `docs/ai-interactions.md`

**Migration required:**

- No — all required schema already existed from Stages 4–7

**Commands and tests:**

- `docker compose up -d` / `ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (47), test:e2e (45), audit — Fail (19 moderate transitive `js-yaml` advisories)
- `root`: build, lint, test — Pass

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Maintenance: `js-yaml` audit remediation

**Date:** 2026-06-15

**Advisory:** GHSA-h67p-54hq-rp68 (CVE-2026-53550) — quadratic-complexity DoS in YAML merge-key parsing; fixed in `js-yaml@4.2.0`, published 2026-06-15.

**Dependency chains:** `@nestjs/swagger` (production, `js-yaml@4.1.1`) and Jest coverage tooling via `@istanbuljs/load-nyc-config` (development, `js-yaml@3.14.2`). Root and frontend audits were unaffected.

**Exposure:** Limited in this project — Swagger uses `js-yaml` for `dump()` only (OpenAPI YAML export), not parsing untrusted YAML; Jest chain is dev-only.

**Remediation:** Added `overrides: { "js-yaml": "4.2.0" }` to `backend/package.json`.

**Verification:**

- `npm ls js-yaml` — all instances `4.2.0`
- `npm audit` — 0 vulnerabilities
- `build`, `lint`, `test` (47), `test:e2e` (45) — Pass
- `GET /api/docs` — 200 (Swagger UI)
- `GET /api/docs-yaml` — 200 (OpenAPI YAML)

---

## Stage 9: CoinGecko Market Data Integration

**Date:** 2026-06-15

**Prompt summary:**

Integrate CoinGecko into the backend so authenticated users can retrieve live market data for their selected coins via a protected endpoint, with validation, mapping, error handling, Swagger, and mocked tests.

**Response summary:**

Added `MarketModule` with `CoinGeckoClient`, `MarketService`, and `GET /api/market` (JWT). Loads selected active coins, calls CoinGecko `/coins/markets` in one batched request, validates/maps to camelCase DTOs, and handles upstream failures safely.

**Main decisions:**

- Demo API auth via `x-cg-demo-api-key` header; env vars validated at startup
- No CoinGecko call when user has no selected coins
- Single batched `/coins/markets` request using internal `coingeckoId` values only
- Results follow selected-coins alphabetical order by supported coin name
- Missing CoinGecko items are omitted (no invented data)
- Error policy: `502` upstream/auth/invalid response, `503` rate limit, `504` timeout
- E2E overrides `CoinGeckoClient` — no live API dependency in tests

**Files created or modified:**

- Created: `backend/src/market/*`, `backend/test/market.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/config/*`, `backend/.env.example`, `backend/test/setup-e2e-env.ts`, `docs/ai-interactions.md`, `backend/package.json`, `backend/package-lock.json`

**Dependencies added:**

- `@nestjs/axios`, `axios`

**Migration required:**

- No

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (60), test:e2e (52), audit — Pass
- `root`: build, lint, test — Pass

**Manual smoke test:**

- Register → login → onboarding (coins 1,2) → `GET /api/market` — **200** in ~0.4s, 2 mapped items returned

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Live CoinGecko availability/rate limits depend on configured Demo API key
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 10: NewsData Crypto News Integration

**Date:** 2026-06-15

**Prompt summary:**

Integrate NewsData so authenticated users can retrieve cryptocurrency news for their selected active coins via a protected endpoint with validation, mapping, pagination, duplicate removal, and mocked tests.

**Response summary:**

Added `NewsModule` with `NewsDataClient`, `NewsService`, and `GET /api/news` (JWT). Loads selected coins, calls NewsData crypto API in one batched request, validates/maps articles, deduplicates, sorts by publication date, and forwards pagination tokens.

**Main decisions:**

- NewsData auth via `apikey` query parameter; env vars validated at startup
- No NewsData call when user has no selected coins
- Single request with comma-separated lowercase `coin` symbols from internal DB
- Default `limit` 5; allowed range 1–10; opaque `page` token forwarded unchanged
- Duplicate removal: unique `article_id`, then normalized URL
- Sort: publication date descending; invalid dates last
- Missing `image_url` → `null`; paid-plan placeholders (`content`, `sentiment`, etc.) excluded
- Error policy: `502` upstream/auth/malformed, `503` rate limit, `504` timeout
- E2E overrides `NewsDataClient` — no live API in tests

**Files created or modified:**

- Created: `backend/src/news/*`, `backend/test/news.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/config/*`, `backend/.env.example`, `backend/test/setup-e2e-env.ts`, `docs/ai-interactions.md`

**Dependencies added:**

- None (`@nestjs/axios` and `axios` already installed in Stage 9)

**Migration required:**

- No

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (73), test:e2e (61), audit — Pass
- `root`: build, lint, test — Pass

**Manual smoke test:**

- Login → selected coins → `GET /api/news?limit=5` — **200** in ~1.0s, 5 mapped articles, pagination token returned

**Unresolved issues:**

- E2E requires Docker PostgreSQL with migrations applied
- Live NewsData availability/rate limits depend on configured API key
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 11: OpenRouter AI Insight Integration

**Date:** 2026-06-16

**Prompt summary:**

Integrate OpenRouter to generate a short, personalized, educational daily crypto insight for authenticated users based on investor profile, selected coins, market data, and news — without persistence, cache, or financial advice.

**Response summary:**

Added `InsightsModule` with `OpenRouterClient`, `InsightsService`, and `GET /api/insights/daily` (JWT). Orchestrates preferences, selected coins, `MarketService`, and `NewsService`, builds a compact fact-only prompt, calls OpenRouter chat completions, validates structured JSON output, and returns title, insight, fixed disclaimer, and `generatedAt`.

**Main decisions:**

- OpenRouter env vars validated at startup; Bearer auth; `POST /chat/completions` with `response_format: json_object`, temperature 0.2
- No OpenRouter call when user has no selected coins (`400`) or market data is empty (`502`)
- News limited to 3 headlines for compact prompts
- Strict system prompt: facts-only, educational, no predictions or recommendations
- Application adds fixed disclaimer; model must return exactly `title` + two-sentence `insight` JSON
- Response validation: exact keys, two-sentence rule, recommendation phrase rejection
- Error policy: `502` auth/upstream/malformed, `503` rate limit, `504` timeout
- E2E overrides `OpenRouterClient`, `CoinGeckoClient`, and `NewsDataClient` — no live APIs in tests
- Exported `MarketService` and `NewsService` for cross-module orchestration

**Files created or modified:**

- Created: `backend/src/insights/*`, `backend/test/insights.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/config/*`, `backend/src/market/market.module.ts`, `backend/src/news/news.module.ts`, `backend/.env.example`, `backend/test/setup-e2e-env.ts`, `docs/ai-interactions.md`

**Dependencies added:**

- None (`@nestjs/axios` and `axios` reused from Stage 9)

**Migration required:**

- No

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (98), test:e2e (71), audit — Pass
- `root`: build, lint, test — Pass

**Manual smoke test:**

- **200** in ~12.0s — response structure passed (`title`, `insight`, `disclaimer`, `generatedAt`); content passed safety checks (exactly two sentences, no recommendation/prediction language, no reasoning/usage/provider fields)

**Unresolved issues:**

- Live insight generation depends on a valid OpenRouter API key and model availability
- E2E requires Docker PostgreSQL with migrations applied
- Local `DB_PORT` may need to match `POSTGRES_PORT` when host `5432` is occupied

---

## Stage 12: Imgflip Crypto Meme Integration

**Date:** 2026-06-16

**Prompt summary:**

Integrate Imgflip to generate a light, personalized cryptocurrency meme for authenticated users based on selected coins and current market data, without persistence or cache.

**Response summary:**

Added `MemesModule` with `ImgflipClient`, `MemesService`, and `GET /api/memes/daily` (JWT). Loads selected coins and market data, builds deterministic captions from the coin with the largest absolute 24h move, calls Imgflip `caption_image`, validates `success` in the response body, and returns mapped URLs and captions with `generatedAt`. Each call generates a new meme until persistence is added later.

**Main decisions:**

- Imgflip env vars validated at startup; username/password auth via form-urlencoded POST
- No Imgflip call when user has no selected coins (`400`) or market data is empty (`502`)
- Deterministic captions only — no OpenRouter or AI text generation
- Largest absolute 24h percentage change selects the featured coin; neutral watchlist fallback when percentages are unavailable
- HTTP `200` with `success: false` treated as failure; raw `error_message` never returned
- Error policy: `502` auth/template/malformed, `503` rate limit, `504` timeout
- E2E overrides `ImgflipClient` and `CoinGeckoClient` — no live APIs in tests

**Files created or modified:**

- Created: `backend/src/memes/*`, `backend/test/memes.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/config/*`, `backend/.env.example`, `backend/test/setup-e2e-env.ts`, `docs/ai-interactions.md`

**Dependencies added:**

- None (`@nestjs/axios` and `axios` reused)

**Migration required:**

- No

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (119), test:e2e (81), audit — Pass
- `root`: build, lint, test — Pass

**Manual smoke test:**

- **200** in ~1.3s — `imageUrl` and `pageUrl` both opened successfully; both captions present in response and visible on the Imgflip page; response structure passed validation with no credentials or raw Imgflip fields exposed

**Unresolved issues:**

- Live meme generation depends on valid Imgflip credentials
- Endpoint generates a new meme on every call until persistence/cache is implemented
- E2E requires Docker PostgreSQL with migrations applied

---

## Stage 13: Dashboard Orchestration

**Date:** 2026-06-16

**Prompt summary:**

Implement one authenticated dashboard endpoint that orchestrates user info, preferences, selected coins, market data, news, AI insight, and meme generation with preference-based execution and partial failure support.

**Response summary:**

Added `DashboardModule` with `GET /api/dashboard` (JWT). Verifies user existence and completed onboarding (`409` if incomplete), loads preferences and selected coins, then concurrently loads enabled sections. Each section returns `available`, `unavailable`, or `disabled` without failing the whole dashboard when optional external services fail.

**Main decisions:**

- Reuses existing `UsersService`, `PreferencesService`, `SelectedCoinsService`, `MarketService`, `NewsService`, `InsightsService`, and `MemesService`
- Enabled sections loaded concurrently via `Promise.all`; failures caught per section with safe messages
- Disabled preferences skip service calls and return `{ status: "disabled" }`
- News limited to 5 items on dashboard; no pagination query params (empty `DashboardQueryDto` rejects unknown query fields)
- User response excludes email and sensitive fields; dashboard-level `generatedAt` added in application
- Exported `InsightsService` and `MemesService` for cross-module orchestration
- No cache or persistence — insight and meme regenerate on each enabled dashboard request; repeated market/news calls may occur through insight/meme internal dependencies until later stages

**Files created or modified:**

- Created: `backend/src/dashboard/*`, `backend/test/dashboard.e2e-spec.ts`
- Modified: `backend/src/app.module.ts`, `backend/src/insights/insights.module.ts`, `backend/src/memes/memes.module.ts`, `docs/ai-interactions.md`

**Dependencies added:**

- None

**Migration required:**

- No

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (129), test:e2e (89), audit — Pass
- `root`: build, lint, test — Pass

**Manual smoke test:**

- **200** in ~8.0s — all enabled sections `available`; user, preferences, and selected coins correct; no secrets or raw provider fields exposed

**Performance limitation:**

- Total dashboard latency is dominated by live insight generation (~12s previously) plus market, news, and meme calls; no caching yet

**Unresolved issues:**

- Repeated market/news API calls when insight and meme are both enabled
- Insight and meme regenerate on every dashboard request until persistence/cache is added
- E2E requires Docker PostgreSQL with migrations applied

---

## Stage 14: Dashboard Data Reuse and Duplicate External Call Reduction

**Date:** 2026-06-16

**Prompt summary:**

Reduce duplicate CoinGecko and NewsData calls within a single `GET /api/dashboard` request by reusing already-loaded market and news data for insight and meme generation.

**Response summary:**

Added `InsightsService.generateFromData()` and `MemesService.generateFromMarketData()` for caller-supplied data. `DashboardService` now loads shared market/news once per request (based on preference dependencies), then passes results to insight/meme generation. Hidden dependencies supported: market or news may load internally while the public section remains `disabled`.

**Reuse strategy:**

- Market required when `showMarketPrices`, `showAiInsight`, or `showMeme` is enabled
- News required when `showNews` or `showAiInsight` is enabled
- Shared loads run concurrently; insight and meme generation reuse the same in-memory results
- Standalone `/api/market`, `/api/news`, `/api/insights/daily`, and `/api/memes/daily` unchanged

**Files created or modified:**

- Created: `backend/src/insights/interfaces/insight-generation.interfaces.ts`, `backend/src/memes/interfaces/meme-generation.interfaces.ts`, `backend/src/dashboard/interfaces/dashboard-shared-data.interfaces.ts`
- Modified: `backend/src/dashboard/dashboard.service.ts`, `backend/src/dashboard/dashboard.controller.ts`, `backend/src/insights/insights.service.ts`, `backend/src/memes/memes.service.ts`, related specs, `backend/test/dashboard.e2e-spec.ts`, `docs/ai-interactions.md`

**Commands and tests:**

- `docker compose ps` — Pass (healthy)
- `migration:show` / `run` — Pass (no pending migrations)
- `backend`: build, lint, test (133), test:e2e (93), audit — Pass
- `root`: build, lint, test — Pass

**Live performance result:**

- **200** in ~14.5s — all enabled sections `available`; no measurable latency improvement vs Stage 13 (~8.0s); duplicate market/news calls eliminated within the dashboard request (verified in E2E)

**Remaining limitations before persistence/cache:**

- Insight and meme still regenerate on every dashboard request
- No cross-request cache or daily persistence
- Total latency still dominated by live OpenRouter and Imgflip calls

---

## Documentation: Backend README

**Date:** 2026-06-16

**Summary:** Updated `backend/README.md` to document the implemented architecture, setup, environment variables, API endpoints, Postman flow, dashboard partial availability, migrations, testing, external services, security, and current limitations as of Stage 14.

---

## Documentation: Project structure reorganization

**Date:** 2026-06-16

**Summary:** Reorganized documentation into `README.md` (overview), `RUN.md` (operations), `backend/README.md` (backend design/API), `frontend/README.md` (scaffold status), and `docs/ai-interactions.md` (development log). Moved setup and test commands from the backend README to `RUN.md`.

---

## Stage 15: News relevance filtering

**Date:** 2026-06-16

**Summary:** Added deterministic server-side news relevance filtering in `NewsService` after NewsData mapping and deduplication. Articles must match a selected coin via `relatedCoins` plus title/description text, or via a strong title match. Irrelevant loosely tagged articles are removed; `nextPage` is preserved and pages may return fewer than `limit` items.

**Automated verification:** backend build, lint, unit tests, E2E tests, audit, and root build/lint/test — pass.

**Live smoke test:** `GET /api/news?limit=5` returned **200** in ~0.66s with **3** relevant BTC/ETH articles (fewer than requested limit); loosely tagged irrelevant articles excluded; response shape unchanged (`items`, `nextPage`); `nextPage` present.

**Remaining limitations:** no automatic extra NewsData page fetches to refill filtered pages; no persistence or cache.

