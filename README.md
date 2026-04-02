# Expense Tracker

Personal expense tracker monorepo: **React + Vite + MUI** frontend, **AWS Lambda + DynamoDB** backend. Includes **AI-assisted expense parsing** and **goal ETA forecasting**.

**Deployed:** add your production frontend/API URLs here when available.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, MUI v7, TanStack React Query v5 |
| Frontend hosting | S3 + CloudFront (serverless-finch) |
| Backend | AWS Lambda (Node.js 20.x), API Gateway (HTTP API) |
| Database | DynamoDB (single-table design) |
| Backend framework | Serverless Framework + serverless-esbuild |
| Auth | JWT (access 15 min) + refresh tokens (7 days, stored in DynamoDB with TTL) |
| Validation | Zod |
| AI | OpenAI API (expense parsing, goal insights) |

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| Node.js | 20+ |
| pnpm | 10+ (see `packageManager` in root `package.json`) |
| AWS CLI | Configured with credentials that can deploy Lambda, API Gateway, DynamoDB, S3, CloudFront |
| OpenAI (optional) | API key for live AI expense parsing and goal insights |

## Monorepo layout

```text
packages/
  backend/   AWS Lambda handlers, DynamoDB repositories, services, Middy middleware
  frontend/  React app (Vite, MUI, React Query), deployed to S3 + CloudFront
```

### Architecture (high level)

- **Backend**: 20 Lambda functions (one per route), thin handlers calling services, services calling repositories. Middy middleware handles JWT auth and error formatting. DynamoDB single-table with three GSIs covers all access patterns.
- **Frontend**: `src/pages/` (page components + page-local hooks/dialogs), `src/api/` (API client functions), `src/types/` (Zod schemas + TS types), `src/lib/` (pure utilities), `src/theme/` for responsive dark UI.

### Design choices

- **Zod at boundaries** — invalid payloads fail fast with clear field-level messages.
- **Single-table DynamoDB** — all entities share one table; GSIs handle user-scoped, date-range, and category queries without secondary tables.
- **Server-side date hints** — calendar `referenceDate` + IANA `timezone` from the client; natural-language dates resolved server-side with OpenAI.
- **Forecast `asOfIsoDate`** — optional parameter on `computeGoalForecast` for deterministic tests; production always uses "today".

## Environment variables

Copy from the `.env.example` files in each package:

```bash
copy packages\backend\.env.example  packages\backend\.env
copy packages\frontend\.env.example packages\frontend\.env
```

**Backend** (`packages/backend/.env`):

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Access token signing secret — 32+ random characters |
| `REFRESH_TOKEN_SECRET` | Yes | Refresh token signing secret — 32+ chars, different from `JWT_SECRET` |
| `OPENAI_API_KEY` | No | Enables AI expense parsing and goal insights |
| `OPENAI_MODEL` | No | e.g. `gpt-4o` or `gpt-4o-mini` |
| `TABLE_NAME` | No | DynamoDB table name; Serverless sets it automatically to `expense-tracker-<stage>` |
| `AWS_REGION` | No | Defaults to `us-east-1` |

**Frontend** (`packages/frontend/.env`):

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | API Gateway invoke URL, no trailing slash (e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com`) |

## Local development

Install dependencies:

```bash
pnpm install
```

Start the frontend dev server:

```bash
pnpm dev   # http://localhost:3000
```

Set `VITE_API_BASE_URL` in `packages/frontend/.env` to the API Gateway URL from the deployed backend.

## Deployment

### 1. Deploy backend (Lambda + DynamoDB + API Gateway)

```bash
pnpm deploy:backend
# or: pnpm --filter @expense-tracker/backend deploy
```

This runs `serverless deploy` which provisions Lambda functions, API Gateway HTTP API, and the DynamoDB table via CloudFormation.

### 2. Seed predefined categories (once after first deploy)

```bash
pnpm seed
# or: pnpm --filter @expense-tracker/backend seed
```

Writes the 13 built-in categories to DynamoDB. Idempotent — safe to re-run.

### 3. Deploy frontend (S3 + CloudFront)

First deploy, provision the infrastructure:

```bash
pnpm deploy:frontend:infra
```

On every subsequent release, upload the built assets:

```bash
pnpm deploy:frontend:client
```

Or deploy both in one go:

```bash
pnpm deploy:frontend
```

Update `VITE_API_BASE_URL` in `packages/frontend/.env` to the API Gateway URL from step 1 before building.

## Quality checks

```bash
pnpm typecheck   # tsc --noEmit in all packages
pnpm lint        # eslint per package
pnpm lint:fix    # eslint --fix on all src trees
pnpm test        # Jest (backend) + Vitest (frontend)
```

## Testing

```bash
pnpm --filter @expense-tracker/backend test   # Jest — services, repositories, goal forecast
pnpm --filter @expense-tracker/frontend test  # Vitest — utilities, hooks, UI components
```

## Core API

All routes except `/auth/*` require `Authorization: Bearer <access-token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account; returns tokens + user |
| POST | `/auth/login` | Sign in; returns tokens + user |
| POST | `/auth/refresh` | Exchange refresh token for a new pair |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/expenses` | Paginated list (query: `startDate`, `endDate`, `categoryId`, `limit`, `cursor`) |
| POST | `/expenses` | Create expense |
| PUT | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |
| GET | `/categories` | Predefined + user custom categories |
| POST | `/categories` | Create custom category |
| PUT | `/categories/{id}` | Update custom category |
| DELETE | `/categories/{id}` | Delete custom category |
| GET | `/goals` | Get user's goal (`404` if none) |
| POST | `/goals` | Create goal (one per user) |
| PUT | `/goals` | Update goal |
| DELETE | `/goals` | Delete goal |
| GET | `/reports/monthly` | Monthly spending totals |
| GET | `/reports/by-category` | Breakdown by category |
| POST | `/ai/parse-expense` | Parse natural-language expense description with OpenAI |

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Backend Lambda errors on deploy | Ensure AWS credentials are configured and have the required IAM permissions (Lambda, API Gateway, DynamoDB, CloudFormation, IAM, S3). |
| `VITE_API_BASE_URL` wrong | Copy the API Gateway URL from the `serverless deploy` output; no trailing slash, no path prefix. |
| Frontend "failed to fetch" | Confirm `VITE_API_BASE_URL` matches the API Gateway invoke URL. Check browser network tab for CORS errors. |
| AI parse unavailable | Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `packages/backend/.env`; redeploy. Without them the endpoint returns `503`. |
| Categories list empty | Run `pnpm seed` after the first backend deploy to write predefined categories to DynamoDB. |
| CORS errors | The backend `serverless.yml` enables CORS on the HTTP API globally; verify the stage was deployed after any CORS config changes. |

## License

Private — adjust as needed.
