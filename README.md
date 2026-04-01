# Expense Tracker

Personal expense tracker monorepo: **React + Vite + MUI** frontend, **Express + MongoDB** backend, shared **Zod** contracts. Includes **AI-assisted expense parsing** and **goal ETA forecasting**.

**Repository:** `https://github.com/YOUR_USERNAME/Expense-Tracker` (replace with your fork)

**Deployed:** add your production frontend/API URLs here when available.

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| Node.js | 20+ |
| pnpm | 10+ (see `packageManager` in root `package.json`) |
| MongoDB | Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string |
| OpenAI (optional) | API key for live NL expense parsing |

Optional: **AWS CLI** only if you deploy to AWS later; not required for local dev.

## Monorepo layout

```text
packages/
  backend/   Express API, MongoDB, auth, AI, goal forecasting
  frontend/  React app (Vite, MUI, React Query)
  shared/    Shared types and Zod schemas
```

### Architecture (high level)

- **Shared** (`@expense-tracker/shared`): request/response shapes and validation — single source of truth for API contracts.
- **Backend**: `config/` (env), `middleware/` (auth, errors), `modules/*/repository.ts` (data access), `modules/*/service.ts` (rules), `modules/*/routes.ts` (HTTP).
- **Frontend**: feature folders under `src/features/`, API clients under `src/api/`, theme and layout for responsive UI.

### Design choices

- **Zod at boundaries** — invalid payloads fail fast with clear messages.
- **Server-side date hints** — calendar `referenceDate` + IANA `timezone` from the client; natural-language dates normalized with **chrono-node** where possible, with OpenAI for structured fields.
- **Forecast `asOfIsoDate`** — optional parameter on `computeGoalForecast` for deterministic tests; production uses “today”.

## Environment variables

Use the **`.env.example`** files as copy-paste sources; each file lists variables with short comments.

| File to create | Copy from |
|----------------|-----------|
| Repo root `.env` (optional) | `.env.example` |
| `packages/backend/.env` | `packages/backend/.env.example` |
| `packages/frontend/.env` | `packages/frontend/.env.example` |

**Backend (required):** `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET` (min 16 characters), `CLIENT_ORIGIN`.  
**Backend (optional):** `OPENAI_API_KEY`, `OPENAI_MODEL` — without them, AI parse returns a friendly error (logged server-side).

**Frontend (required):** `VITE_API_BASE_URL` — must point at `/api/v1` on your backend.

Invalid backend env vars throw on startup **after** a `console.error` with field-level detail. Missing `VITE_API_BASE_URL` throws at app load with a message pointing at `packages/frontend/.env.example`.

## Setup (step by step)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start MongoDB locally (or use Atlas and put the URI in `packages/backend/.env`).

3. Copy env files:

   ```bash
   copy packages\backend\.env.example packages\backend\.env
   copy packages\frontend\.env.example packages\frontend\.env
   ```

   Edit `JWT_SECRET`, and confirm `MONGODB_URI` / `VITE_API_BASE_URL`.

4. Run migrations (creates indexes / collections):

   ```bash
   pnpm --filter @expense-tracker/backend migrate
   ```

5. Build (optional sanity check):

   ```bash
   pnpm run build
   ```

## Run locally

```bash
pnpm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000` (or your `PORT`)

## Quality checks

```bash
pnpm run typecheck    # tsc --noEmit in all packages
pnpm run lint         # eslint per package
pnpm run lint:fix     # eslint --fix on all src trees
pnpm test             # backend unit tests; shared/frontend placeholders
```

## Testing

Backend tests include goal forecast logic and natural-date parsing:

```bash
pnpm --filter @expense-tracker/backend test
```

## Core API (authenticated except `/auth/*`)

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `GET/POST /api/v1/expenses`, `PUT/DELETE /api/v1/expenses/:id`
- `GET/POST /api/v1/goals`
- `GET /api/v1/categories`, `POST/PATCH/DELETE` for custom categories
- `POST /api/v1/ai/parse-expense` — requires OpenAI config on the server

Send `Authorization: Bearer <token>` on protected routes.

## Product expectations

- **Responsive UI** — MUI breakpoints and touch-friendly targets.
- **Loading & errors** — React Query mutations, alerts on failures, friendly AI error messages (no raw provider errors in UI).
- **Forms** — shared Zod schemas; validation messages surfaced in dialogs.
- **Logging** — `console.error` for config failures and unexpected AI paths (details server-side).

## Deployment (outline)

1. Host MongoDB (e.g. Atlas).
2. Set production `packages/backend/.env` (or host env vars): `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` to your frontend URL, `OPENAI_*` if using AI.
3. Build frontend with `VITE_API_BASE_URL` pointing at your API.
4. Run API behind HTTPS; keep CORS aligned with `CLIENT_ORIGIN`.
5. Optional: port handlers to **AWS Lambda + API Gateway** — service/repository layers stay reusable.

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Backend exits on start | `packages/backend/.env` — Zod error lists missing/invalid fields. |
| CORS errors | `CLIENT_ORIGIN` must match the browser origin (scheme + host + port). |
| Frontend “failed to fetch” | `VITE_API_BASE_URL` includes `/api/v1` and matches backend `PORT`. |
| AI parse unavailable | `OPENAI_API_KEY` and `OPENAI_MODEL` set in **backend** `.env`; restart server. |
| `@expense-tracker/shared` resolution | Use workspace `pnpm install`; shared exports TypeScript sources for dev. |

## License

Private / assessment — adjust as needed.
