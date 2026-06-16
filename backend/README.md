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
| `FeedbackModule` | User thumbs-up/down content feedback |
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
| `GET` | `/feedback` | JWT | Batch read user votes | `200` | `400`, `401` |
| `PUT` | `/feedback` | JWT | Upsert vote (UP/DOWN) | `200` | `400`, `401`, `404` |
| `GET` | `/dashboard` | JWT | Full dashboard | `200` | `400`, `401`, `404`, `409`, `500` |

### `GET /api/news` query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | `5` | Articles to return (**1–10**) |
| `page` | string | — | Opaque NewsData pagination token (max 500 chars) |

`GET /api/dashboard` rejects unknown query parameters (`400`).

### Feedback (`PUT` / `GET /api/feedback`)

Authenticated users can vote **UP** or **DOWN** on dashboard content. Identity comes only from the JWT; client-supplied `userId` is rejected.

**Content types:** `MARKET`, `NEWS`, `INSIGHT`, `MEME`

**Vote behavior:**

- One row per `(userId, contentType, contentId)` — repeating the same vote is idempotent.
- Changing UP → DOWN (or DOWN → UP) updates the existing row; no duplicate rows.
- Clicking the currently selected vote again keeps it selected (no DELETE endpoint in this stage).

**Stable content IDs** (returned on dashboard items as `feedbackContentId`):

| Section | `contentType` | `contentId` example |
|---------|---------------|---------------------|
| Coin Prices | `MARKET` | `coin:1` (internal coin id) |
| Market News | `NEWS` | article id, e.g. `article-1` |
| AI Insight | `INSIGHT` | `daily-insight:123` (persisted row id) |
| Crypto Meme | `MEME` | `daily-meme:456` (persisted row id) |

`PUT /api/feedback` body:

```json
{
  "contentType": "INSIGHT",
  "contentId": "daily-insight:123",
  "feedbackType": "UP"
}
```

`GET /api/feedback?contentIds=coin:1,article-1,daily-insight:123` returns the authenticated user's matching votes for dashboard batch loading.

The service validates that referenced content exists and is visible to the user (selected active coin, owned daily insight/meme, non-empty news id). Stored feedback is for future personalization and offline evaluation — **no model training or recommendation changes are implemented**.

**Future use (not implemented):** content ranking, prompt personalization, relevance scoring, supervised preference datasets, and offline model evaluation.

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
| `daily_insights` | One persisted AI insight per user per UTC day |
| `daily_memes` | One persisted meme per user per UTC day |
| `feedback` | User thumbs-up/down votes on dashboard content |
| `migrations` | TypeORM migration history (internal) |

### Migrations

Schema changes are applied only through TypeORM migrations (`synchronize: false`, `migrationsRun: false`). See [../RUN.md](../RUN.md) for commands.

Existing migrations:

- `CreateUsersTable`
- `CreateCoinsTable`
- `CreateUserPreferencesTable`
- `CreateUserSelectedCoinsTable`
- `CreateDailyContentTables`
- `CreateFeedbackTable`

### Feedback entity

Table `feedback`: `id`, `userId` (FK → `users.id`, `ON DELETE CASCADE`), `contentType`, `contentId`, `feedbackType`, `createdAt`, `updatedAt`.

Unique constraint on `(userId, contentType, contentId)`. Enums: `contentType` ∈ `MARKET | NEWS | INSIGHT | MEME`; `feedbackType` ∈ `UP | DOWN`. No raw provider responses, JWTs, emails, prompts, or secrets are stored.

### Daily insight and meme persistence

`GET /api/insights/daily`, `GET /api/memes/daily`, and the dashboard insight/meme sections reuse stored content for the same authenticated user and **UTC calendar date**.

- The first request of the day generates content, stores a safe JSONB snapshot and context hash, and returns the public response.
- Later same-day requests with a matching context hash return the stored row without calling OpenRouter or Imgflip.
- The context hash includes investor profile and selected coin IDs for insights. For memes it includes user ID, investor profile, sorted selected coin IDs, and the configured template pool version. Changing those values invalidates today's stored row and triggers regeneration.
- Meme template and caption style are chosen deterministically from `userId`, UTC date, investor profile, sorted selected coin IDs, and the configured template pool version (`IMGFLIP_TEMPLATE_IDS`). Template and caption family are selected independently so the same template can appear with different text on non-consecutive days.
- Daily memes vary by user, UTC date, investor profile, selected coins, and 24-hour market movement direction. Captions use only supplied facts (coin symbol/name, formatted change, profile tone) and avoid financial recommendation language.
- Consecutive UTC days avoid repeating the same template or caption variation when the pool offers alternatives, using the previous day's persisted meme as input.
- If the selected Imgflip template fails, the service retries once with the next deterministic template in the approved pool.
- Same user and UTC day reuse the stored meme; a new UTC day or different user usually receives a different variation. No random generation occurs on refresh.
- `generatedAt` in API responses comes from the stored row timestamp (`updatedAt`).
- Concurrent requests use PostgreSQL unique constraints plus upsert so at most one row exists per user per UTC day; generation happens outside the database transaction, then a short atomic upsert persists the result.

### In-memory Market and News cache

Mapped market and news responses are cached in-process via `@nestjs/cache-manager` using two logical layers per resource:

| Layer | Purpose | Default TTL env |
|-------|---------|-----------------|
| Fresh | Normal short-lived cache | `MARKET_CACHE_TTL_SECONDS` (**120s**), `NEWS_CACHE_TTL_SECONDS` (**300s**) |
| Stale (last-known) | Fallback after provider failure | `MARKET_STALE_TTL_SECONDS` (**1800s** / 30 min), `NEWS_STALE_TTL_SECONDS` (**3600s** / 60 min) |

Stale TTL must be **≥** the corresponding fresh TTL (validated at startup).

| Cache | Key basis |
|-------|-----------|
| Market | `market:{fresh\|stale}:usd:{sorted-coingecko-ids}` — e.g. `market:fresh:usd:bitcoin,ethereum` |
| News | `news:v2:{fresh\|stale}:{sorted-symbols}:limit={n}:page={first\|hash}` — e.g. `news:v2:fresh:BTC,ETH:limit=5:page=first` |

**Flow:** fresh hit → return cached data; fresh miss → call provider; on success store in **both** fresh and stale layers; on failure look up stale only (after the provider attempt) and return last-known mapped data if present. Provider errors are never cached. Empty successful responses may be stored. Cache read/write failures log a sanitized warning and fall back to provider calls or return provider data. The cache is local to one backend process and **clears on restart** — after restart, provider failure with no repopulated stale entry preserves existing error behavior.

Keys are **not** user-specific. Only safe mapped internal responses are stored (never raw provider payloads, credentials, or error bodies).

**Dashboard metadata:** when market or news sections are `available` after a stale fallback, `isStale: true` is included. Standalone `GET /api/market` and `GET /api/news` response contracts are unchanged (no `isStale` field).

---

## External Integrations

| Provider | Role | Auth |
|----------|------|------|
| CoinGecko | Market prices, 24h change, highs/lows | API key header |
| NewsData | Crypto news for selected symbols | API key query param |

NewsData results are filtered server-side after mapping and deduplication. An article is kept only when at least one selected coin is explicitly mentioned in the article `title` or `description` (coin name, standalone symbol, or meaningful CoinGecko id). Provider `relatedCoins` metadata may support mapping but is **not** sufficient on its own. Filtering is deterministic (no AI classification). A page may return fewer items than the requested `limit`; `nextPage` from the upstream response is preserved without automatic extra fetches.

| OpenRouter | Educational insight JSON | Bearer API key |
| Imgflip | Meme image from template + captions | **Username and password** (form POST) |

All calls originate from the backend. Credentials are configured in `backend/.env` and are not exposed to clients.

---

## Dashboard Behavior

### Partial availability

Each content section returns `available`, `unavailable`, or `disabled`. A failing optional provider can still yield overall **`200 OK`** with only affected sections marked `unavailable`.

| Status | Meaning |
|--------|---------|
| `available` | Data loaded successfully; market/news may include `isStale: true` when last-known cached data was used after a provider failure |
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
- **E2E tests** — `npm run test:e2e` (full `AppModule`, isolated PostgreSQL database `moveo_crypto_advisor_test`, mocked external clients).

See [../RUN.md](../RUN.md) for full quality commands.

---

## Current Limitations

- Market and news cache is in-process only (not Redis); both fresh and stale layers clear on process restart.
- Stale fallback is unavailable immediately after restart until a successful provider response repopulates the stale layer.
- Insight and meme are persisted per user per UTC day; changing investor profile or selected coins invalidates today's stored content.
- Market and news still call external providers on cache miss.
- News pages may return fewer than the requested `limit` after relevance filtering; no automatic extra NewsData fetches are made to fill a page.
- Dashboard latency is dominated by OpenRouter (and Imgflip when enabled).
- Free-tier external API rate limits may affect manual testing.
- Feedback votes are stored but do not yet change ranking, prompts, or recommendations.
- No aggregate vote counts, delete-vote endpoint, or admin analytics for feedback.

---

## Security Summary

- bcrypt password hashing (12 rounds)
- JWT Bearer authentication
- Unique email constraint
- Startup environment validation
- Safe upstream error mapping
- Secrets excluded from version control
