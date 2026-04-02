# Video Presentation Script — Expense Tracker (5–10 min)

## Overview

| Segment | Topic | Target time |
|---|---|---|
| 1 | Intro & app demo | 0:00 – 2:30 |
| 2 | Architecture decisions | 2:30 – 5:00 |
| 3 | Code walkthrough × 3 modules | 5:00 – 9:00 |
| 4 | Wrap-up | 9:00 – 10:00 |

---

## Segment 1 — App In Action (0:00 – 2:30)

**[Screen: browser open to the dashboard]**

> "This is Expense Tracker — a personal finance app I built as a full-stack, cloud-native monorepo. Let me show you what it does before we go under the hood."

**[Action: log in]**

> "Authentication uses JWTs — a short-lived 15-minute access token and a 7-day refresh token stored in DynamoDB with a TTL, so sessions expire automatically without any cron job."

**[Action: navigate to Expenses page — expenses list is visible]**

> "Here's the expense list. I can filter by date range or category, and the list is cursor-paginated — no offset pagination, which would break on DynamoDB. Each page request returns a cursor the frontend hands back on the next call."

**[Action: click 'Add Expense' — type a natural-language sentence like "grabbed coffee and a sandwich for $14.50 yesterday"]**

> "This is the AI parse feature. Instead of filling in a form, I type a natural-language description. The backend calls OpenAI, passes today's calendar date in my timezone, and gets back structured data — amount, category, date, and a confidence score. The category is resolved against my own category list so the AI can never return something that doesn't exist in my data."

**[Screen shows parsed result auto-filling the form — confirm/save]**

> "I confirm and save. The expense is written to DynamoDB."

**[Action: navigate to Goals page]**

> "I have a monthly spending goal set. Every time an expense is created, updated, or deleted, the backend automatically recalculates this insight — either with OpenAI if a key is configured, or with a deterministic rule-based fallback. The goal insight you see here updated in real-time from that last save."

**[Action: briefly show Reports page — monthly chart, category breakdown]**

> "Reports give me monthly totals and a category breakdown, all queried directly from DynamoDB without any separate analytics store."

---

## Segment 2 — Key Architecture Decisions (2:30 – 5:00)

**[Screen: switch to VS Code or a simple slide with a diagram]**

### Decision 1 — Single-table DynamoDB design with three GSIs

> "The single most impactful design decision was the DynamoDB single-table layout. Every entity — users, expenses, categories, goals, refresh tokens — lives in one table. The access patterns drove the GSI design:"

> "GSI2 is a user-date index: `GSI2PK = USER#<id>`, `GSI2SK = DATE#<YYYY-MM-DD>#<expenseId>`. That covers date-range queries in one sorted scan."

> "GSI3 adds category: `GSI3PK = USER#<id>#CAT#<categoryId>`, `GSI3SK = DATE#<...>`. Combined category + date filter hits GSI3 directly — no in-memory filtering."

> "This means zero extra tables, fast O(log n) range queries, and a clean cursor from `LastEvaluatedKey`."

### Decision 2 — Thin handlers, service layer, repository layer

> "Every Lambda handler is intentionally thin — it does exactly three things: authenticate with the `requireAuth` middleware, validate the request body with Zod, and delegate to a service. No business logic leaks into the handler. Services call repositories; repositories own all DynamoDB SDK calls. This made unit-testing the service layer trivial without mocking Lambda events."

### Decision 3 — Reactive goal insight on every write

> "Rather than computing insights on-demand at read time, the goal insight is recalculated and persisted synchronously on every expense mutation. The read path is always cheap — just a DynamoDB `GetItem`. The write path absorbs the cost of the OpenAI call. This keeps the Goals page fast and the frontend simple."

### Decision 4 — Zod at every boundary

> "Zod schemas are the only place where untrusted data is accepted — handler bodies and API responses. Internal function calls between services and repositories use TypeScript types exclusively. No defensive validation deep in the call stack."

---

## Segment 3 — Code Walkthrough (5:00 – 9:00)

### Module 1 — `expense.repository.ts` — The DynamoDB query strategy (5:00 – 6:30)

**[Screen: open `packages/backend/src/repositories/expense.repository.ts`]**

> "Let's look at `listExpensesByUser`. It has a three-branch query strategy:"

```
categoryId present  →  Query GSI3 (UserCategoryDateIndex)
date range only     →  Query GSI2 (UserExpenseDateIndex)
no filters          →  Query primary table: PK begins_with EXP#
```

> "The branch is just an `if/else if` at the top of the function. There's no dynamic query builder — each branch constructs its own `QueryCommand` with the right key condition and index name. This is deliberate: explicit branches are easier to read and test than a generic builder."

> "The cursor is a base64url-encoded `LastEvaluatedKey`. DynamoDB gives it to us; we encode it, send it to the frontend, and decode it on the next request. The frontend never knows it's a DynamoDB key."

> "Notice the `ConditionExpression: 'attribute_exists(PK)'` on updates and deletes. This prevents phantom writes — if another process deletes the item between our read and our write, the condition fails and we surface a clean 404 rather than silently creating a new record."

---

### Module 2 — `ai.service.ts` — The AI expense parsing pipeline (6:30 – 7:45)

**[Screen: open `packages/backend/src/services/ai.service.ts`]**

> "The AI service is the most interesting part of the system. `parseExpense` does four things:"

> "First, it fetches all categories — predefined and the user's custom ones — and builds an allowlist of names. This is the key safety constraint: the AI is only allowed to return a category that actually exists."

> "Second, it resolves `referenceDate`. If the client sends a timezone, we compute today's calendar date in that zone server-side. 'Yesterday' in Tokyo and 'yesterday' in New York are different dates — the frontend sends the IANA zone string, the backend resolves it."

> "Third, it calls `callOpenAI` with a structured output schema. OpenAI returns an object with `amount`, `description`, `category`, `date`, `confidence`, and `notes`."

> "Fourth — and this is the safety net — `resolveCategory` maps the AI's returned string against the allowlist: exact match first, then case-insensitive, then fallback to `'Other'`. The AI can return garbage or hallucinate a category name; this function makes sure it never propagates into the database."

> "If `OPENAI_API_KEY` or `OPENAI_MODEL` aren't set, the function throws a typed `503` error immediately. The handler catches that status code and surfaces it as a proper HTTP 503. No silent degradation, no 500 errors — the caller gets a clear signal that AI is unavailable."

---

### Module 3 — `goals.service.ts` — `recalculateGoalInsight` (7:45 – 9:00)

**[Screen: open `packages/backend/src/services/goals.service.ts`]**

> "The last module ties everything together. `recalculateGoalInsight` is called at the end of every `createExpense`, `updateExpense`, and `deleteExpense`. Here's what it does in sequence:"

> "It loads the user's goal. If there's no goal, it returns immediately — no wasted work."

> "It fires four parallel `Promise.all` calls: current month's expenses, previous month's expenses, predefined categories, and user custom categories. One round trip to DynamoDB, not four sequential ones."

> "It builds category-level spending totals for both months, finds the top spending category, and assembles a prompt payload."

> "Then it checks for OpenAI credentials. If present, it calls OpenAI with the spending data and gets a natural-language insight back. If not, it uses `buildFallbackInsight` — a pure function with three rule-based branches: over budget, near budget, or on track. The app is fully functional without OpenAI."

> "Finally it calls `updateGoalInsight` — a single DynamoDB `UpdateItem` that writes the insight string and a timestamp. The next Goals `GET` reads this pre-computed string directly."

> "This pattern — compute on write, serve on read — avoids any cold-path latency on the Goals page and means the insight is always consistent with the expenses as of the last mutation."

---

## Segment 4 — Wrap-Up (9:00 – 10:00)

**[Screen: back to live app or back to README]**

> "To summarise: single-table DynamoDB with three GSIs handles every access pattern without extra infrastructure. Thin Lambda handlers with a service/repository split keep the code testable and the logic isolated. Reactive goal insights keep reads cheap. And the AI pipeline is safe, timezone-aware, and gracefully degrades without an API key."

> "The stack is React + MUI on the frontend, Lambda + DynamoDB on the backend, deployed entirely with Serverless Framework and serverless-finch. No containers, no servers to manage."

> "Thanks for watching."

---

## Presenter Notes

- **Demo order matters**: log in → add AI-parsed expense → watch goal insight update → show reports. This tells a complete story in under 2.5 minutes.
- **Have a demo account pre-seeded** with 2–3 months of data so reports and the goal page look meaningful.
- **Keep browser DevTools open on the Network tab** during the AI parse demo — showing the raw JSON response (with `confidence` and `notes` fields) makes the structured-output aspect concrete.
- **For the code walkthrough**, use split-screen: browser on the left showing the live action, VS Code on the right showing the code path being discussed.
- **If you go over 10 min**, cut the Reports page tour from Segment 1 and the Zod decision from Segment 2 — those are the lowest-density sections.
