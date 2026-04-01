# Plan: Backend API — Expense Tracker

**TL;DR:** Design a RESTful backend for the Personal Expense Tracker using Serverless Framework (16 Lambdas, one per route), a DynamoDB single-table design with 3 GSIs covering all access patterns, and a layered architecture (handler → service → repository).

---

## DynamoDB Single-Table Design

**Table:** `expense-tracker-{stage}`  
**Keys:** `PK` (String), `SK` (String)

### GSIs

| Index | Hash Key | Sort Key | Purpose |
|---|---|---|---|
| `GSI1-EmailIndex` | `GSI1PK` | `GSI1SK` | Email → userId lookup (login) |
| `GSI2-UserExpenseDateIndex` | `GSI2PK` | `GSI2SK` | Expenses by user within date range |
| `GSI3-UserCategoryDateIndex` | `GSI3PK` | `GSI3SK` | Expenses by user + category + date |

---

### Item Schemas

**User**
| Attribute | Value |
|---|---|
| `PK` | `USER#<userId>` |
| `SK` | `METADATA` |
| `GSI1PK` | `EMAIL#<email>` |
| `GSI1SK` | `USER#<userId>` |
| attrs | `userId`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt` |

**RefreshToken** *(DynamoDB TTL on `expiresAt`)*
| Attribute | Value |
|---|---|
| `PK` | `USER#<userId>` |
| `SK` | `TOKEN#<tokenId>` |
| attrs | `tokenId`, `expiresAt` (Unix epoch), `createdAt` |

**Custom Category**
| Attribute | Value |
|---|---|
| `PK` | `USER#<userId>` |
| `SK` | `CAT#<categoryId>` |
| attrs | `categoryId`, `name`, `color`, `createdAt` |

**Predefined Category** *(seeded once at deploy time, never mutated by users)*
| Attribute | Value |
|---|---|
| `PK` | `CATEGORY#PREDEFINED` |
| `SK` | `CAT#<categoryId>` |
| attrs | `categoryId`, `name`, `color`, `createdAt` |

Predefined items are written by a one-shot seed script (`scripts/seed-categories.ts`) run as a Serverless deployment hook or standalone `ts-node` invocation. The 13 built-in names (`Food`, `Transport`, `Housing`, `Utilities`, `Entertainment`, `Health`, `Shopping`, `Travel`, `Education`, `Subscriptions`, `Other`, …) are the source of truth; the seed script uses `BatchWriteItem` with `ConditionExpression: attribute_not_exists(PK)` so re-running is idempotent.

**Expense**
| Attribute | Value |
|---|---|
| `PK` | `USER#<userId>` |
| `SK` | `EXP#<expenseId>` |
| `GSI2PK` | `USER#<userId>` |
| `GSI2SK` | `DATE#<YYYY-MM-DD>#<expenseId>` |
| `GSI3PK` | `USER#<userId>#CAT#<categoryId>` |
| `GSI3SK` | `DATE#<YYYY-MM-DD>#<expenseId>` |
| attrs | `expenseId`, `amount`, `description`, `categoryId`, `date`, `createdAt`, `updatedAt` |

---

### Access Patterns Covered

| # | Pattern | DynamoDB Operation |
|---|---|---|
| 1 | Get user by ID | `GetItem PK=USER#<id>, SK=METADATA` |
| 2 | Get user by email (login) | `Query GSI1 GSI1PK=EMAIL#<email>` |
| 3 | Validate/delete refresh token | `GetItem` / `DeleteItem PK=USER#<id>, SK=TOKEN#<tokenId>` |
| 4 | List predefined categories | `Query PK=CATEGORY#PREDEFINED, SK begins_with CAT#` |
| 5 | List custom categories | `Query PK=USER#<id>, SK begins_with CAT#` |
| 6 | CRUD single category | `GetItem`/`PutItem`/`UpdateItem`/`DeleteItem PK=USER#<id>, SK=CAT#<catId>` |
| 7 | CRUD single expense | `GetItem`/`PutItem`/`UpdateItem`/`DeleteItem PK=USER#<id>, SK=EXP#<expId>` |
| 8 | List all expenses for user | `Query PK=USER#<id>, SK begins_with EXP#` |
| 9 | List expenses in date range | `Query GSI2 GSI2PK=USER#<id>, GSI2SK between DATE#<start> and DATE#<end>~` |
| 10 | List expenses by category | `Query GSI3 GSI3PK=USER#<id>#CAT#<catId>` |
| 11 | List expenses by category + date range | `Query GSI3` + `GSI3SK` range filter |
| 12 | Monthly spending totals | `Query GSI2 GSI2PK=USER#<id>, GSI2SK begins_with DATE#<YYYY-MM>` |

---

## API Endpoints

**Auth** *(public)*
- `POST /auth/register` — create account; body: `{ name* (required), email*, password* }`; returns access + refresh tokens + user `{ userId, name, email }`
- `POST /auth/login` — verify credentials; body: `{ email*, password* }`; returns access + refresh tokens + user `{ userId, name, email }`
- `POST /auth/refresh` — exchange refresh token for new pair
- `POST /auth/logout` — delete refresh token *(requires JWT)*

**Categories** *(all require JWT)*
- `GET /categories` — returns predefined categories (queried from DynamoDB `PK=CATEGORY#PREDEFINED`) + authenticated user's custom categories (`PK=USER#<id>`) as two separate arrays:
  ```json
  {
    "predefined": [{ "categoryId": "...", "name": "Food", "color": "#..." }],
    "custom":     [{ "categoryId": "...", "name": "...", "color": "...", "createdAt": "..." }]
  }
  ```
  Both queries run in parallel (`Promise.all`). Predefined items are seeded at deploy time and never user-specific.
- `POST /categories` — create custom category; body: `{ name* (max 50 chars), color* (hex e.g. #ff5733) }`; returns created `{ categoryId, name, color, createdAt }`
- `PUT /categories/{categoryId}` — update custom category
- `DELETE /categories/{categoryId}` — delete custom category

**Expenses** *(all require JWT; query params: `startDate`, `endDate`, `categoryId`, `limit`, `cursor`)*
- `GET /expenses`
- `POST /expenses`
- `GET /expenses/{expenseId}`
- `PUT /expenses/{expenseId}`
- `DELETE /expenses/{expenseId}`

**Reports** *(all require JWT)*
- `GET /reports/monthly?startDate=&endDate=` — spending totals per month
- `GET /reports/by-category?startDate=&endDate=` — breakdown by category

---

## Lambda Architecture (1 per route = 16 functions)

Each handler is a thin entry point — parses input, calls service, returns HTTP response.

```
packages/new-backend/src/
  handlers/
    auth/          register.ts  login.ts  refresh.ts  logout.ts
    categories/    list.ts  create.ts  update.ts  delete.ts
    expenses/      list.ts  create.ts  get.ts  update.ts  delete.ts
    reports/       monthly.ts  by-category.ts
  services/        auth.service.ts  categories.service.ts
                   expenses.service.ts  reports.service.ts
  repositories/    user.repository.ts  category.repository.ts
                   expense.repository.ts
  middleware/      auth.ts (JWT Middy)  error.ts (centralised error handler)
  models/          user.ts  expense.ts  category.ts  common.ts
  lib/             dynamo.ts  jwt.ts  response.ts  validation.ts (Zod)
  scripts/         seed-categories.ts
  serverless.yml   package.json  tsconfig.json  jest.config.ts
```

---

## Key Libraries

| Purpose | Library |
|---|---|
| DynamoDB client | `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (v3) |
| Middleware | `@middy/core`, `@middy/http-json-body-parser`, `@middy/http-error-handler` |
| JWT | `jsonwebtoken` |
| Passwords | `bcryptjs` |
| Validation | `zod` |
| IDs | `uuid` |
| Bundling | `serverless` + `serverless-esbuild` |
| Testing | `jest` + `ts-jest` |

---

## Auth Flow

1. **Register/Login** → bcrypt hash/verify → write User (including `name`) + RefreshToken item → return 15min access JWT (payload: `{ userId, name, email }`) + 7d refresh token (UUID stored in DB with TTL) + user object `{ userId, name, email }`
2. **Authenticated requests** → Middy middleware reads `Authorization: Bearer <token>` → verifies JWT signature → injects `userId` into handler context
3. **Refresh** → `GetItem` token → validate expiry → `DeleteItem` old → `PutItem` new → return new pair (rotation prevents replay)
4. **Logout** → `DeleteItem` refresh token item

---

## Relevant Files to Create

- `packages/new-backend/serverless.yml` — provider, functions (16 entries), DynamoDB resource with all GSIs, IAM, env vars
- `packages/new-backend/src/lib/dynamo.ts` — singleton `DynamoDBDocumentClient`
- `packages/new-backend/src/repositories/*.ts` — all DynamoDB queries
- `packages/new-backend/src/services/*.ts` — business logic
- `packages/new-backend/src/handlers/**/*.ts` — 16 thin Lambda handlers
- `packages/new-backend/src/middleware/auth.ts` — Middy JWT middleware
- `packages/new-backend/src/models/*.ts` — TypeScript interfaces
- `packages/new-backend/src/scripts/seed-categories.ts` — one-shot `BatchWriteItem` script seeding 13 predefined category items under `PK=CATEGORY#PREDEFINED`; idempotent (condition: `attribute_not_exists(PK)`)
- `packages/new-backend/.env.example` — `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DYNAMODB_TABLE_NAME`, `AWS_REGION`
- `packages/new-backend/tsconfig.json`, `jest.config.ts`, `package.json`

---

## Verification Steps

1. `tsc --noEmit` — zero type errors
2. `eslint --fix src` — zero lint warnings
3. `pnpm test` — unit tests for all services + repositories pass
4. `serverless offline` — all 16 routes respond correctly locally
5. Run `pnpm seed` (in `packages/new-backend`) — 13 predefined category items written to DynamoDB; re-run is a no-op
6. Manual test: `GET /categories` → `predefined` array contains 13 items, `custom` array is empty for a new user
7. Manual test: register → login → create category → create expense → list with date filter → check reports endpoint
8. `serverless deploy --stage dev` — successful AWS deployment, API Gateway URL works end-to-end

---

## Further Considerations

1. **Pagination cursor** — `GET /expenses` uses DynamoDB `LastEvaluatedKey` (base64-encoded) as cursor; `limit` defaults to 50. Frontend passes `cursor=<token>` for next page.
2. **Category deletion guard** — when deleting a custom category, decide whether to reject if expenses reference it, or allow deletion (expenses keep `categoryId` as orphan ref). Recommendation: allow deletion, frontend shows "Unknown" for orphaned refs.
3. **Report aggregation** — `reports/monthly` and `reports/by-category` aggregate in Lambda (no DynamoDB stream/aggregation pipeline needed at this scale). Fine for free-tier usage.
