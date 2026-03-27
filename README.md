# Expense Tracker

A monorepo full-stack assessment project for **Option 1: Personal Expense Tracker** with two AI-assisted features:

- **NL Expense Entry**: parse natural-language expense text into structured form data
- **Goal ETA Forecast**: keep a visible savings goal card updated with a projected ETA and actionable insight

The current local-first implementation uses **React + Vite + MUI** on the frontend and **Express + MongoDB** on the backend for fast iteration. The backend is structured so the HTTP layer can be swapped for **AWS Lambda + API Gateway** later without rewriting the domain logic.

## Stack

- Frontend: React 18, TypeScript, Vite, MUI, React Query
- Backend: Node.js 20+, TypeScript, Express.js, MongoDB native driver
- Shared: TypeScript types and Zod schemas in one package
- AI: server-side LLM integration with deterministic fallbacks

## Monorepo Layout

```text
packages/
  backend/   Express API, Mongo access, auth, AI, forecasting
  frontend/  React app with auth, dashboard, smart entry, goals
  shared/    Shared types and validation schemas
```

## Architecture Notes

### Shared Contracts

`packages/shared` defines the core request/response types and validation schemas once. Both the frontend and backend import those contracts, which keeps payloads aligned and reduces drift.

### Backend Layering

The backend is intentionally simple:

- `config/`: environment parsing and validation
- `middleware/`: auth and centralized error handling
- `modules/*/repository.ts`: database access only
- `modules/*/service.ts`: validation and business rules
- `modules/*/routes.ts`: HTTP routing

This keeps responsibilities narrow and makes a future Lambda migration straightforward.

### AI Design

#### 1. NL Expense Entry

`POST /api/v1/ai/parse-expense`

- relative dates like `yesterday` and `last Tuesday` are resolved **server-side first**
- the resolved date is passed into the AI context rather than asking the model to infer it blindly
- uncertain fields should return `null`
- if `OPENAI_API_KEY` is missing or the model fails, a deterministic fallback parser still returns a usable response

#### 2. Goal ETA Forecast

`GET /api/v1/goals`

- goals are always visible on the dashboard
- forecast data travels with the goal payload
- forecast recalculation runs whenever goals are listed and after expense, budget, or category bulk-updates
- the generated insight string is stored on the goal document (updated each recalculation)
- if there is not enough history, the API returns an explicit insufficient-data message instead of a misleading prediction

### Categories

Custom categories are stored on the user document in MongoDB (not browser storage). Renaming or deleting a custom category updates all matching expenses in one bulk operation and refreshes goal forecasts.

- `GET /api/v1/categories` — `{ custom: string[] }`
- `POST /api/v1/categories` — `{ name }`
- `PATCH /api/v1/categories` — `{ from, to }` (rename; you may target a built-in name to merge into it)
- `DELETE /api/v1/categories/:name` — reassigns expenses to **Other** and removes the custom label

## Environment Files

### Root

Create `.env` at the repo root only if you want shared AI defaults:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### Backend

Copy `packages/backend/.env.example` to `packages/backend/.env`

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=expense_tracker
JWT_SECRET=replace-with-a-long-secret
CLIENT_ORIGIN=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Variable notes:

- `PORT`: local Express port
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: database name for local/offline development
- `JWT_SECRET`: signing key for auth tokens
- `CLIENT_ORIGIN`: allowed frontend origin for CORS
- `OPENAI_API_KEY`: optional, enables live AI calls
- `OPENAI_MODEL`: optional model override

### Frontend

Copy `packages/frontend/.env.example` to `packages/frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

## Local Setup

Prerequisites:

- Node.js 20+
- pnpm 10+
- MongoDB running locally

Run:

```bash
pnpm install
pnpm run build
pnpm run dev
```

Expected local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Core API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `PUT /api/v1/expenses/:expenseId`
- `DELETE /api/v1/expenses/:expenseId`
- `GET /api/v1/goals`
- `POST /api/v1/goals`
- `GET /api/v1/budget-plan`
- `PUT /api/v1/budget-plan`
- `POST /api/v1/ai/parse-expense`

All `/api/v1/*` routes except `/auth/*` require a JWT bearer token.

## Testing

The backend includes unit tests for the goal forecast logic. This is the critical pure-business logic behind the dynamic ETA card.

Run:

```bash
pnpm test
```

## What’s Implemented

- JWT auth with register/login
- expense create/list/edit/delete
- category support with predefined or custom free-text categories
- month and category spend summaries in the dashboard
- smart expense entry with loading states and null-safe parsed fields
- budget plan persistence
- goal creation and dynamic ETA forecasting
- graceful insufficient-data handling for new users
- environment validation and centralized error handling

## Deployment Path

For the assessment review, this version optimizes for local speed and clear code. To move this into AWS later:

1. keep the current service/repository modules unchanged
2. replace the Express route adapter with Lambda handlers
3. move MongoDB to Atlas if needed
4. add IaC with CDK or Serverless Framework

## Troubleshooting

- If the backend crashes on startup, check `packages/backend/.env` first. Required variables fail fast with a readable message.
- If AI parsing does not use the live model, verify `OPENAI_API_KEY` is present. The app will still work with deterministic fallback behavior.
- If the frontend cannot reach the API, confirm `VITE_API_BASE_URL` matches the backend port and that `CLIENT_ORIGIN` allows `http://localhost:3000`.
