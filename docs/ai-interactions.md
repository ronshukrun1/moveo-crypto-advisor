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

