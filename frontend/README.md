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
├── pages/            # Route-level placeholder screens
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
| `/onboarding` | Protected | Onboarding-required placeholder |
| `/dashboard` | Protected | Dashboard placeholder (auth verified) |
| `/preferences` | Protected | Preferences structure placeholder |
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

## Current stage limitations (Stage 20)

**Implemented:** full register + login screens and auth flow, auth context startup user loading via `/api/auth/me`, onboarding-aware route guards, logout, and frontend tests for auth flows.

**Not yet implemented:**

- Google OAuth
- Token refresh and password reset
- Onboarding API integration
- Dashboard API integration (`GET /api/dashboard`)
- Preferences API integration
- Feedback, charts, sentiment, or regeneration controls

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
