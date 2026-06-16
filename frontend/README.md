# Moveo Crypto Advisor — Frontend

React + TypeScript + Vite single-page application for the Moveo Crypto Advisor product. This package provides personalized crypto market insights through a dark-themed Material UI interface.

**Local setup and run commands:** see [../RUN.md](../RUN.md).

**Backend API reference:** see [../backend/README.md](../backend/README.md).

---

## Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server and production build |
| Material UI (MUI) | Component library and design system |
| Emotion | MUI styling engine |
| React Router | Client-side routing |
| Axios | HTTP client for the NestJS backend |

---

## Design system

Visual design follows approved product screenshots (landing, auth, onboarding, dashboard). Key decisions:

- **Dark theme** — backgrounds `#080B10` / `#11161D`, turquoise primary accent `#43D6C8`
- **Typography** — system sans-serif stack with semantic variants (`heroTitle`, `pageTitle`, `sectionTitle`, `muted`, etc.)
- **Components** — rounded cards, pill buttons, subtle borders, minimal shadows
- **Semantic colors** — green/red for positive/negative values; yellow for warnings (e.g. stale data)

All palette and typography values are centralized in `src/theme/`. Do not hardcode colors in feature components.

Product wording reflects the backend: **personalized crypto market insights** (not investment recommendations). AI content will later include: *For educational purposes only. Not financial advice.*

---

## Folder structure

```text
src/
├── api/              # Axios client, error normalization, endpoint paths, health check
├── app/              # App shell, router, providers
├── auth/             # Auth context, token storage, protected routes
├── components/
│   ├── common/       # Buttons, inputs, selectable cards, badges, logo
│   ├── feedback/     # Error boundary
│   ├── layout/       # AppShell, headers, page containers, section cards
│   └── states/       # Loading, error, empty, unavailable, disabled, stale, API status
├── config/           # Environment validation
├── pages/            # Route-level screens
├── dashboard/        # Dashboard types, sections, data hook
├── preferences/      # Preferences page hook, validation, tests
├── onboarding/       # Onboarding flow, shared option constants, step components
├── theme/            # MUI theme, palette, typography, component overrides
└── types/            # Shared frontend types (e.g. dashboard section status)
```

---

## Routing

| Path | Access | Status |
|------|--------|--------|
| `/` | Public | Landing page (hero + feature preview) |
| `/login` | Public | Login form (real API flow) |
| `/register` | Public | Registration form (real API flow) |
| `/onboarding` | Protected | Three-step onboarding flow (real API) |
| `/dashboard` | Protected | Personalized dashboard (`GET /api/dashboard`) |
| `/preferences` | Protected | Dashboard preferences editor |
| `/forbidden` | Public | Access denied page |
| `*` | Public | Not found page |

Protected routes redirect unauthenticated users to `/login` and preserve the intended destination in router state.

---

## Authentication

### Registration (`/register`)

The frontend registration form sends exactly the backend `POST /api/auth/register` payload:

```json
{ "name": "Ron", "email": "ron@example.com", "password": "StrongPass123!" }
```

The UI includes `Confirm Password`, but **`confirmPassword` is frontend-only** and is never sent to the backend.

### Login (`/login`)

- Calls `POST /api/auth/login` and stores only the returned `accessToken` in `localStorage` via `auth-storage.ts`.
- Loads the authenticated user from `GET /api/auth/me` (source of truth).
- Redirects based on `onboardingCompleted`:
  - `false` → `/onboarding`
  - `true` → preserved destination (when safe) or `/dashboard`

### Auth context

React Context provides:

- `user` (from `/api/auth/me`)
- `accessToken` (stored locally)
- `login(credentials)` and `logout()`
- `refreshUser()`
- `isInitializing` and recoverable initialization error state

JWT is not decoded client-side.

**Production note:** HttpOnly secure cookies are generally preferred over `localStorage` for access tokens. This assignment uses `localStorage` for simplicity.

---

## API client

- Base URL from `VITE_API_BASE_URL` (validated at startup)
- Automatically attaches `Authorization: Bearer <token>` when a token exists
- `401` responses clear the stored token; the auth layer handles redirect to login
- Errors normalized to `ApiError` — UI components do not receive raw Axios errors
- Auth API functions are implemented in `src/api/auth.ts` (register, login, current user)
- Onboarding API functions in `src/api/onboarding.ts` and `src/api/coins.ts`
- Dashboard API function in `src/api/dashboard.ts` (`GET /api/dashboard` only — no standalone market/news/insight/meme calls from the dashboard page)

---

## Dashboard (`/dashboard`)

The dashboard loads a single orchestrated response from `GET /api/dashboard` and renders four personalized sections:

1. **Market News**
2. **Coin Prices**
3. **AI Insight of the Day**
4. **Fun Crypto Meme**

Each section supports backend statuses `available`, `unavailable`, and `disabled`. Market and News may include `isStale: true` when last-known cached data is shown after a provider failure.

**Partial availability:** one section failing or being disabled does not block the rest of the dashboard.

**Manual refresh:** one page-level refresh action re-fetches the full dashboard; section-specific refresh, polling, and regeneration are not implemented.

**Preferences:** links to `/preferences` open the settings page for onboarding-completed users.

**Not implemented on dashboard:** feedback voting, charts, sentiment labels, confidence scores, AI/meme regeneration.

Visual layout follows the approved dashboard screenshot (dark two-column card grid, turquoise accents).

---

## Environment

Copy the example file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:3000/api` |

Frontend env vars are embedded at build time and are public. Never store secrets here.

---

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npm test
```

Run backend and frontend together from the repository root: `npm run dev`.

Ensure `FRONTEND_URL` in `backend/.env` matches the Vite dev origin for CORS.

---

## Onboarding (`/onboarding`)

Three-step authenticated flow (in-memory state only; restarting the page before submission resets progress):

1. **Investor profile** — select exactly one backend enum value:
   - `BEGINNER`
   - `LONG_TERM_HOLDER`
   - `ACTIVE_TRADER`
   - `CRYPTO_ENTHUSIAST`
2. **Content preferences** — toggle booleans (default all `true`):
   - `showMarketPrices`
   - `showNews`
   - `showAiInsight` (includes educational disclaimer)
   - `showMeme`
3. **Select coins** — load `GET /api/coins`, select at least one coin by backend `id`

Submission calls `POST /api/onboarding` with:

```json
{
  "investorProfile": "BEGINNER",
  "showMarketPrices": true,
  "showNews": true,
  "showAiInsight": true,
  "showMeme": true,
  "coinIds": [1, 2]
}
```

On success, the app calls `refreshUser()` via `GET /api/auth/me` and redirects to `/dashboard` when `onboardingCompleted` is `true`.

---

## Preferences (`/preferences`)

Authenticated settings page for users with `onboardingCompleted=true`. Loads canonical backend state on mount:

- `GET /api/preferences`
- `GET /api/selected-coins`
- `GET /api/coins`

The form reuses onboarding option definitions (`INVESTOR_PROFILE_OPTIONS`, `CONTENT_PREFERENCE_OPTIONS`) and step components for investor profile, dashboard content toggles, and coin selection.

**Save behavior:** changes are tracked against the last loaded backend state. Save calls only the endpoints that changed:

- `PATCH /api/preferences` — partial payload with changed profile/content fields only
- `PUT /api/selected-coins` — full `{ coinIds: number[] }` replace

Independent changed requests run concurrently. After save, the page re-fetches preferences and selected coins and shows success, partial failure, or error messaging. The frontend does not clear backend daily-content persistence; the next dashboard load reflects backend invalidation rules.

**Product rule:** at least one coin must remain selected in the UI (backend `PUT` allows an empty array, but Market, News, Insight, and Meme depend on selected coins).

**Limitation:** unsaved edits are lost on browser refresh; a `beforeunload` warning is shown when practical.

**Discard Changes** restores the last loaded backend state without writing to the server.

---

## Current stage limitations (Stage 23)

**Implemented:** real dashboard UI, preferences editor (`/preferences`) with separate save operations and partial-failure handling, and shared onboarding option definitions.

**Not yet implemented:**

- Google OAuth
- Token refresh and password reset
- Feedback voting on insight or meme
- Charts, sentiment labels, confidence scores
- AI or meme regeneration and section-specific refresh
- Persisting incomplete onboarding drafts across refresh
- Persisting unsaved preferences drafts across refresh

---

## Visual references

Design screenshots used as references (dark theme, turquoise accent, card/input/button styles):

- Landing page hero and feature cards
- Registration form layout
- Onboarding selection cards
- Dashboard four-panel grid

Screenshots are not copied literally where they show unsupported product features (Google auth, feedback buttons, sentiment/confidence scores, etc.).

---

## Related documentation

- [Project overview](../README.md)
- [Run guide](../RUN.md)
- [Backend API](../backend/README.md)
