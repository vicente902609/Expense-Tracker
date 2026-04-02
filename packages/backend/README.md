# Backend API — Expense Tracker

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

**Goal** *(1:1 with User — at most one goal per user)*
| Attribute | Value |
|---|---|
| `PK` | `USER#<userId>` |
| `SK` | `GOAL` |
| attrs | `name` (string), `targetExpense` (number — monthly spending cap), `insight` (string), `insightUpdatedAt` (ISO string), `createdAt`, `updatedAt` |

The fixed `SK=GOAL` enforces the 1:1 constraint at the data layer — a `PutItem` with `ConditionExpression: attribute_not_exists(SK)` on create prevents duplicates. No GSI needed; the item is always fetched directly by `PK=USER#<userId>, SK=GOAL`.

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
| 13 | Get user's goal | `GetItem PK=USER#<id>, SK=GOAL` |
| 14 | Create user's goal (enforce 1:1) | `PutItem PK=USER#<id>, SK=GOAL` with `attribute_not_exists(SK)` condition |
| 15 | Update user's goal | `UpdateItem PK=USER#<id>, SK=GOAL` |
| 16 | Delete user's goal | `DeleteItem PK=USER#<id>, SK=GOAL` |

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

**Goals** *(all require JWT; 1:1 per user)*
- `GET /goals` — retrieve the authenticated user's goal; `404` if none exists; returns:
  ```json
  {
    "name": "Monthly Budget",
    "targetExpense": 2000,
    "insight": "You're on track! Current spend ($1 420) is within your $2 000 target.",
    "insightUpdatedAt": "2026-04-01T10:00:00.000Z",
    "createdAt": "2026-03-01T09:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  }
  ```
- `POST /goals` — create the user's goal; `409` if a goal already exists; body: `{ name* (1–80 chars), targetExpense* (positive) }`; triggers insight recalculation immediately; returns `201` with the created goal
- `PUT /goals` — update `name` and/or `targetExpense`; body: `{ name? (1–80 chars), targetExpense? (positive) }` (at least one required); triggers insight recalculation; `404` if no goal exists
- `DELETE /goals` — delete the user's goal; `404` if none; returns `204`

  **Insight calculation** (runs in-Lambda synchronously on POST, PUT, and as a side-effect of POST/PUT/DELETE `/expenses`):
  1. Query current-month expenses: `GSI2 GSI2PK=USER#<id>, GSI2SK begins_with DATE#<YYYY-MM>` where `YYYY-MM` is the current calendar month.
  2. Query previous-month expenses: same GSI, `YYYY-MM` shifted one month back.
  3. Sum totals and group by `categoryId`; resolve category names via `GetItem` or a cached `Query PK=USER#<id>, SK begins_with CAT#` + `Query PK=CATEGORY#PREDEFINED`.
  4. Determine `status`:
     - If `currentMonthTotal <= targetExpense` → **on track**: insight = `"You're on track! Current spend ($X) is within your $T target."`
     - If `currentMonthTotal > targetExpense` → **over budget**: find the category with the largest spend delta vs the previous month; insight = `"You're over budget by $D. Consider reducing <CategoryName> expenses (↑$Δ vs last month) to stay within your $T target."`
     - If `currentMonthTotal > targetExpense * 0.9` (within 10%) → **at risk**: insight = `"Heads up — you've used $X of your $T monthly target with X days remaining. Watch your <CategoryName> spending."`
  5. Write updated `insight` + `insightUpdatedAt` back to the Goal item via `UpdateItem`.

  **Side-effect trigger**: the `expenses.service.ts` calls `recalculateGoalInsight(userId)` at the end of `createExpense`, `updateExpense`, and `deleteExpense`. If the user has no goal, the call is a no-op.

**Reports** *(all require JWT)*
- `GET /reports/monthly?startDate=&endDate=` — spending totals per month
- `GET /reports/by-category?startDate=&endDate=` — breakdown by category

**AI** *(requires JWT)*
- `POST /ai/parse-expense` — parse a natural-language expense description with OpenAI and return structured fields; body: `{ text* (3–500 chars), timezone (IANA, default "UTC"), referenceDate? (YYYY-MM-DD) }`; returns:
  ```json
  {
    "amount": 12.50,
    "description": "Lunch with client",
    "category": "Food",
    "date": "2026-03-31",
    "confidence": 0.95,
    "notes": ["Resolved 'yesterday' relative to referenceDate"]
  }
  ```
  - `category` is resolved against the user's predefined + custom category allowlist; falls back to `"Other"` when no match.
  - `amount`, `description`, `date` are `null` if the model cannot determine them.
  - Returns `503` when `OPENAI_API_KEY` / `OPENAI_MODEL` env vars are missing; `502` on model error.

---

## Lambda Architecture (1 per route = 20 functions)

Each handler is a thin entry point — parses input, calls service, returns HTTP response.

```
packages/new-backend/src/
  handlers/
    auth/          register.ts  login.ts  refresh.ts  logout.ts
    categories/    list.ts  create.ts  update.ts  delete.ts
    expenses/      list.ts  create.ts  get.ts  update.ts  delete.ts
    goals/         get.ts  create.ts  update.ts  delete.ts
    reports/       monthly.ts  by-category.ts
    ai/            parse-expense.ts
  services/        auth.service.ts  categories.service.ts
                   expenses.service.ts  goals.service.ts
                   reports.service.ts  ai.service.ts
  repositories/    user.repository.ts  category.repository.ts
                   expense.repository.ts  goal.repository.ts
  middleware/      auth.ts (JWT Middy)  error.ts (centralised error handler)
  models/          user.ts  expense.ts  category.ts  goal.ts  common.ts
  lib/             dynamo.ts  jwt.ts  response.ts  validation.ts (Zod)
                   openai/
                     client.ts          (generic callOpenAI<T>, OpenAICallOptions, error constants)
                     parse-expense.ts   (ParseExpensePrompt, ParsedExpenseModel, buildParseExpenseOptions)
                     index.ts           (re-exports)
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
| AI | raw `fetch` to OpenAI Responses API (`https://api.openai.com/v1/responses`) |
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
- `packages/new-backend/src/handlers/**/*.ts` — 20 thin Lambda handlers
- `packages/new-backend/src/models/goal.ts` — `Goal` interface (`name`, `targetExpense`, `insight`, `insightUpdatedAt`, `createdAt`, `updatedAt`)
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
4. `serverless offline` — all 20 routes respond correctly locally
5. Run `pnpm seed` (in `packages/new-backend`) — 13 predefined category items written to DynamoDB; re-run is a no-op
6. Manual test: `GET /categories` → `predefined` array contains 13 items, `custom` array is empty for a new user
7. Manual test: register → login → create category → create expense → list with date filter → check reports endpoint
8. Manual test: `POST /goals` → `GET /goals` returns goal with insight; `POST /expenses` (new expense) → `GET /goals` returns updated `insight` and `insightUpdatedAt`; `DELETE /goals` → `GET /goals` returns `404`
9. `serverless deploy --stage dev` — successful AWS deployment, API Gateway URL works end-to-end

---

## Further Considerations

1. **Pagination cursor** — `GET /expenses` uses DynamoDB `LastEvaluatedKey` (base64-encoded) as cursor; `limit` defaults to 50. Frontend passes `cursor=<token>` for next page.
2. **Category deletion guard** — when deleting a custom category, decide whether to reject if expenses reference it, or allow deletion (expenses keep `categoryId` as orphan ref). Recommendation: allow deletion, frontend shows "Unknown" for orphaned refs.
3. **Report aggregation** — `reports/monthly` and `reports/by-category` aggregate in Lambda (no DynamoDB stream/aggregation pipeline needed at this scale). Fine for free-tier usage.
4. **Goal insight side-effect cost** — `POST /expenses`, `PUT /expenses/:id`, and `DELETE /expenses/:id` each trigger a synchronous `recalculateGoalInsight` call that runs two GSI2 range queries (current + previous month) plus category name lookups. At free-tier scale this is negligible; consider skipping the recalc on `DELETE` if latency is a concern.
5. **Goal uniqueness enforcement** — `POST /goals` uses `ConditionExpression: attribute_not_exists(SK)` on the DynamoDB `PutItem`. If the condition fails, return `409 Conflict` with message `"A goal already exists for this user. Use PUT /goals to update it."`
6. **Insight staleness** — `insightUpdatedAt` is stored alongside `insight` so clients can show "last updated X minutes ago" if needed; no scheduled recalculation is required.
