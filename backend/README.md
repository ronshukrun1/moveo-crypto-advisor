# Moveo Crypto Advisor — Backend

The backend is built with **NestJS** and **TypeScript** and runs on **Node.js**. It exposes a REST API for a personalized cryptocurrency dashboard: content is tailored to each authenticated user’s investor profile, display preferences, and selected coins. User identity and settings are stored in PostgreSQL; market data, news, AI insight, and memes are fetched through external providers.

**Local setup, migrations, and test commands:** see [../RUN.md](../RUN.md).

The **frontend** in this repository is a React + Vite scaffold only. Product screens and API integration are not yet implemented.

---

## Overview

| Capability | Description |
|------------|-------------|
| Auth | Registration, login, JWT-protected routes |
| Onboarding | Atomic save of preferences, selected coins, and `onboardingCompleted` |
| Preferences | Investor profile and per-section display toggles |
| Coins | Read-only catalog of supported active cryptocurrencies |
| Selected coins | Full replace of the user’s active coin list |
| Market | Live CoinGecko data for selected coins |
| News | Personalized NewsData articles with pagination |
| Insights | Educational AI text via OpenRouter (not financial advice) |
| Memes | Deterministic captions + Imgflip image generation |
| Dashboard | Single orchestrated response with partial provider failure support |

---

## Architecture

```text
Client
  → Controllers        (HTTP, guards, DTO binding, Swagger)
  → Services           (business logic, orchestration)
  → TypeORM / Clients  (PostgreSQL repositories, external HTTP)
```

**Controllers** — Route handling only. No direct repository or Axios access.

**Services** — Domain rules and workflow. Dashboard orchestration lives in `DashboardService`.

**External clients** — `CoinGeckoClient`, `NewsDataClient`, `OpenRouterClient`, `ImgflipClient`. Map upstream failures to safe HTTP exceptions without exposing credentials or raw responses.

**DTOs & validation** — Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`. Unknown fields are rejected.

**Exception filter** — `HttpExceptionFilter` returns a consistent JSON error shape. Stack traces and provider internals are not exposed to clients.

**Environment** — All configuration variables are validated at startup via `class-validator`.

---

## Main Modules

| Module | Responsibility |
|--------|----------------|
| `HealthModule` | Application and database health check |
| `UsersModule` | User entity and lookup |
| `AuthModule` | Register, login, JWT strategy and guard |
| `CoinsModule` | Supported coin catalog |
| `PreferencesModule` | User content preferences |
| `SelectedCoinsModule` | User coin selections |
| `OnboardingModule` | Atomic onboarding transaction |
| `MarketModule` | CoinGecko market data |
| `NewsModule` | NewsData articles |
| `InsightsModule` | OpenRouter educational insight |
| `MemesModule` | Imgflip meme generation |
| `DashboardModule` | Aggregated dashboard response |

---

## Authentication

```text
POST /api/auth/register  → 201
POST /api/auth/login     → 200 (returns accessToken)
Protected routes         → Authorization: Bearer <accessToken>
```

The JWT `sub` claim identifies the user. Client-supplied `userId` in query, body, or route parameters is never trusted.

`GET /api/auth/me` reloads the user from the database and returns **404** if the account was deleted after the token was issued.

---

## API Endpoint Reference

Global prefix: `/api`.

| Method | Path | Auth | Purpose | Success | Common errors |
|--------|------|------|---------|---------|---------------|
| `GET` | `/health` | Public | App and DB health | `200` | `503` |
| `POST` | `/auth/register` | Public | Create account | `201` | `400`, `409` |
| `POST` | `/auth/login` | Public | Obtain JWT | `200` | `400`, `401` |
| `GET` | `/auth/me` | JWT | Current user | `200` | `401`, `404` |
| `GET` | `/coins` | Public | Active coin catalog | `200` | — |
| `GET` | `/preferences` | JWT | Content preferences | `200` | `401`, `404` |
| `PATCH` | `/preferences` | JWT | Update preferences | `200` | `400`, `401`, `404` |
| `GET` | `/selected-coins` | JWT | Selected coins | `200` | `401`, `404` |
| `PUT` | `/selected-coins` | JWT | Replace selections | `200` | `400`, `401`, `404` |
| `POST` | `/onboarding` | JWT | Complete onboarding | `200` | `400`, `401`, `404` |
| `GET` | `/market` | JWT | Market data | `200` | `401`, `404`, `502`, `503`, `504` |
| `GET` | `/news` | JWT | News articles | `200` | `400`, `401`, `404`, `502`, `503`, `504` |
| `GET` | `/insights/daily` | JWT | AI insight | `200` | `400`, `401`, `502`, `503`, `504` |
| `GET` | `/memes/daily` | JWT | Meme image | `200` | `400`, `401`, `502`, `503`, `504` |
| `GET` | `/dashboard` | JWT | Full dashboard | `200` | `400`, `401`, `404`, `409`, `500` |

### `GET /api/news` query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `5` | Articles to return (**1–10**) |
| `page` | string | — | Opaque NewsData pagination token (max 500 chars) |

`GET /api/dashboard` rejects unknown query parameters (`400`).

---

## Validation and Error Handling

### Request validation

- Body and query DTOs use `class-validator` decorators.
- Extra properties are stripped or rejected (`forbidNonWhitelisted`).

### Error response shape

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-06-16T10:00:00.000Z",
  "path": "/api/example",
  "details": ["field must be a string"]
}
```

- `details` — validation failures only.
- `database` — may appear on health `503` responses.

Never returned to clients: stack traces, SQL errors, password hashes, API keys, raw upstream bodies.

---

## Database

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts and `onboardingCompleted` |
| `coins` | Supported cryptocurrency catalog |
| `user_preferences` | Investor profile and display toggles |
| `user_selected_coins` | User-to-coin selections |
| `migrations` | TypeORM migration history (internal) |

### Migrations

Schema changes are applied only through TypeORM migrations (`synchronize: false`, `migrationsRun: false`). See [../RUN.md](../RUN.md) for commands.

Existing migrations:

- `CreateUsersTable`
- `CreateCoinsTable`
- `CreateUserPreferencesTable`
- `CreateUserSelectedCoinsTable`

---

## External Integrations

| Provider | Role | Auth |
|----------|------|------|
| CoinGecko | Market prices, 24h change, highs/lows | API key header |
| NewsData | Crypto news for selected symbols | API key query param |

NewsData results are filtered server-side after mapping and deduplication. An article is kept only when it matches at least one selected coin by symbol/name in `title`, `description`, and `relatedCoins` metadata. Filtering is deterministic (no AI classification). A page may return fewer items than the requested `limit` when loosely tagged articles are removed; `nextPage` from the upstream response is preserved without automatic extra fetches.

| OpenRouter | Educational insight JSON | Bearer API key |
| Imgflip | Meme image from template + captions | **Username and password** (form POST) |

All calls originate from the backend. Credentials are configured in `backend/.env` and are not exposed to clients.

---

## Dashboard Behavior

### Partial availability

Each content section returns `available`, `unavailable`, or `disabled`. A failing optional provider can still yield overall **`200 OK`** with only affected sections marked `unavailable`.

| Status | Meaning |
|--------|---------|
| `available` | Data loaded successfully |
| `unavailable` | Enabled but failed; safe `message` included |
| `disabled` | Turned off in preferences; not shown to the user |

`GET /api/dashboard` requires completed onboarding (`409` otherwise).

### Hidden dependencies

If `showMarketPrices` or `showNews` is `false` but insight or meme is enabled, market or news may still be loaded internally while the public section remains `disabled`.

### Request-scoped market/news reuse

Within a single dashboard request:

- Market and news are each fetched **at most once** when required by enabled sections or hidden dependencies.
- Loaded data is passed to `InsightsService.generateFromData()` and `MemesService.generateFromMarketData()`.
- Standalone `/api/insights/daily` and `/api/memes/daily` still load their own dependencies per request.
- No cross-request cache or global mutable shared state.

---

## Swagger

Interactive documentation: http://localhost:3000/api/docs

Click **Authorize**, then paste the **raw JWT** (`accessToken` from login). Swagger UI sends it as `Authorization: Bearer <token>` automatically — do not type the `Bearer` prefix in the input field.

---

## Testing

- **Unit tests** — `npm test` (mocks external HTTP and dependencies).
- **E2E tests** — `npm run test:e2e` (full `AppModule`, Docker PostgreSQL, mocked external clients).

See [../RUN.md](../RUN.md) for full quality commands.

---

## Current Limitations

- No cross-request cache or Redis.
- Insight and meme regenerate on every `/daily` and dashboard request — no daily persistence tables yet.
- Market and news are always fetched live when required.
- News pages may return fewer than the requested `limit` after relevance filtering; no automatic extra NewsData fetches are made to fill a page.
- Dashboard latency is dominated by OpenRouter (and Imgflip when enabled).
- Free-tier external API rate limits may affect manual testing.
- Frontend product UI and API integration are not implemented in this repository.

---

## Security Summary

- bcrypt password hashing (12 rounds)
- JWT Bearer authentication
- Unique email constraint
- Startup environment validation
- Safe upstream error mapping
- Secrets excluded from version control
