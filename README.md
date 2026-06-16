# Moveo Crypto Advisor

A personalized cryptocurrency dashboard that helps users follow the coins they care about with live market data, relevant news, an educational AI insight, and a light meme — all tailored to their investor profile and content preferences.

## Main Features

- User registration, login, and JWT authentication
- Onboarding with investor profile, content toggles, and selected coins
- Live market data (CoinGecko) for the user’s coin list
- Personalized crypto news (NewsData) with pagination
- Educational AI insight (OpenRouter) — not financial advice
- Meme generation (Imgflip) from real market movement
- Combined dashboard endpoint with partial availability when a provider fails
- Swagger API documentation and automated tests

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Backend | NestJS, TypeScript, Node.js, PostgreSQL, TypeORM, Docker Compose |
| Frontend | React, TypeScript, Vite (scaffold only — product UI not yet built) |
| External APIs | CoinGecko, NewsData, OpenRouter, Imgflip |

## Architecture

```text
Browser (future)
    ↓
NestJS API  ←→  PostgreSQL
    ↓
External providers (market, news, AI, memes)
```

The backend owns authentication, persistence, validation, orchestration, and all third-party integrations. Credentials never reach the client. The frontend scaffold exists but does not yet call the API or implement product screens.

## Repository Structure

```text
moveo-crypto-advisor/
├── README.md                 # This file — project overview
├── RUN.md                    # Local setup, run, test, and troubleshooting
├── docker-compose.yml        # PostgreSQL for local development
├── .env.docker.example       # Docker database placeholders
├── backend/                  # NestJS API
│   └── README.md             # Backend design and API reference
├── frontend/                 # React + Vite scaffold
│   └── README.md             # Frontend status
└── docs/
    └── ai-interactions.md    # Development log (implementation history)
```

## Current Status

| Area | Status |
|------|--------|
| Backend API | Implemented through dashboard orchestration and request-scoped data reuse |
| Database | Migrations for users, coins, preferences, selected coins |
| Frontend | Scaffold only — no product screens or API integration yet |
| Caching / daily persistence | Not implemented |
| Production deployment | Out of scope for current documentation |

## Documentation

| Document | Purpose |
|----------|---------|
| [RUN.md](./RUN.md) | How to install, configure, run, test, and troubleshoot locally |
| [backend/README.md](./backend/README.md) | Backend architecture, modules, endpoints, and behavior |
| [frontend/README.md](./frontend/README.md) | Frontend scaffold status |
| [docs/ai-interactions.md](./docs/ai-interactions.md) | Incremental development log |
