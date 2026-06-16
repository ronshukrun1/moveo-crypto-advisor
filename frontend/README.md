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
| `/login` | Public | Layout placeholder |
| `/register` | Public | Layout placeholder |
| `/onboarding` | Protected | Progress + selection placeholder |
| `/dashboard` | Protected | Four-section grid skeleton |
| `/preferences` | Protected | Preferences structure placeholder |
| `/forbidden` | Public | Access denied page |
| `*` | Public | Not found page |

Protected routes redirect unauthenticated users to `/login` and preserve the intended destination in router state.

---

## Authentication foundation

- React Context exposes `accessToken`, `isAuthenticated`, `isInitializing`, `login(token)`, and `logout()`
- Access token stored in `localStorage` via `auth-storage.ts` (single module — no scattered storage access)
- Login/register API calls are **not** implemented yet
- User identity will later be loaded from `GET /api/auth/me`
- JWT is not decoded client-side

**Production note:** HttpOnly secure cookies are generally preferred over `localStorage` for access tokens. This assignment uses `localStorage` for simplicity.

---

## API client

- Base URL from `VITE_API_BASE_URL` (validated at startup)
- Automatically attaches `Authorization: Bearer <token>` when a token exists
- `401` responses clear the stored token; the auth layer handles redirect to login
- Errors normalized to `ApiError` — UI components do not receive raw Axios errors
- Feature-specific API functions are not implemented yet (except `GET /health`)

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
```

Run backend and frontend together from the repository root: `npm run dev`.

Ensure `FRONTEND_URL` in `backend/.env` matches the Vite dev origin for CORS.

---

## Current stage limitations (Stage 19)

**Implemented:** architecture, MUI theme, routing, auth context, API client, shared layout/components, global states, environment validation, backend health connectivity indicator.

**Not yet implemented:**

- Complete registration and login flows
- Google OAuth
- Token refresh and password reset
- Onboarding API integration
- Dashboard API integration (`GET /api/dashboard`)
- Preferences API integration
- User profile loading (`GET /api/auth/me`)
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
