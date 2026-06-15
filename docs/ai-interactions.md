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

