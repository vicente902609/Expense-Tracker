# Frontend — Expense Tracker

React + Vite + MUI single-page application. Communicates with the backend REST API over JWT auth with automatic token refresh.

## Tech stack

| Concern | Library |
|---|---|
| Framework | React 18 |
| Build | Vite 6 |
| UI | MUI v7 (Material Design, dark theme) |
| Data fetching | TanStack React Query v5 |
| Schema / types | Zod v4 |
| Testing | Vitest + Testing Library |

---

## Running locally

```bash
# From the repo root
pnpm install

# Copy env file and set VITE_API_BASE_URL
copy packages\frontend\.env.example packages\frontend\.env

pnpm dev          # http://localhost:3000
```

`VITE_API_BASE_URL` must be the **API root with no trailing slash** — paths like `/auth/login` and `/expenses` are appended by the client. Examples: `http://localhost:3001` when the backend runs **serverless-offline** (see `httpPort` in `packages/backend/serverless.yml`), your API Gateway invoke URL (often `https://….execute-api.<region>.amazonaws.com/<stage>`), or another local API if you use one. See `packages/frontend/.env.example` for more. The app throws a clear error on startup if the variable is missing.

---

## Deployment

The frontend ships as a static SPA: **Vite builds to `dist/`**, then **Serverless** provisions **S3 + CloudFront** (`serverless.yml`) and syncs assets with **serverless-finch**. **CloudFront cache invalidation** runs after each client deploy (`serverless-cloudfront-invalidate`).

### Prerequisites

- **AWS CLI** configured with credentials that can create/update S3, CloudFront, CloudFormation, and IAM for this stack.
- **Backend already deployed** — you need a real `VITE_API_BASE_URL` (API Gateway URL) before running a production build.

### Important: env at build time

`VITE_*` variables are **inlined when you run `vite build`**. Set `VITE_API_BASE_URL` in `packages/frontend/.env` (or export it in CI) **before** `pnpm build` / `deploy:client`, or the bundle will call the wrong API.

### First-time infrastructure

Creates the S3 bucket, CloudFront distribution, OAC, and bucket policy (one CloudFormation stack per stage):

```bash
# From this package
pnpm deploy:infra

# Or from the repo root
pnpm deploy:frontend:infra
```

Optional stage/region (defaults: `dev`, `us-east-1`):

```bash
pnpm exec serverless deploy --stage prod --region us-east-1
```

After deploy, note the stack **outputs** (S3 bucket name, **CloudFront domain** — that is your site URL).

### Upload a new build (typical release)

Type-checks, builds with Vite, uploads `dist/` to the bucket, and invalidates CloudFront:

```bash
pnpm deploy:client

# Or from the repo root
pnpm deploy:frontend:client
```

### What each script does

| Script | What it runs |
|---|---|
| `deploy:infra` | `serverless deploy` — infra only (no `dist/` upload) |
| `deploy:client` | `pnpm build` then `serverless client deploy --no-confirm` — production assets + invalidation |

`serverless-finch` uploads `dist/` per `custom.client` in `serverless.yml`. `index.html` is sent with `no-cache`; hashed JS/CSS/assets use long-lived cache headers.

### SPA routing

CloudFront custom error responses map **403/404 → `/index.html`** so client-side routes always load the app.

---

## Scripts

```bash
pnpm dev           # Vite dev server with HMR
pnpm build         # Type-check + production build
pnpm typecheck     # tsc --noEmit only
pnpm lint          # ESLint, zero warnings allowed
pnpm test          # Vitest (single run)
pnpm test:watch    # Vitest watch mode
pnpm deploy:infra  # Serverless: S3 + CloudFront stack (first time / infra changes)
pnpm deploy:client # Build + upload dist/ + CloudFront invalidation
```

---

## Folder structure

```
src/
  app/          Root component (App.tsx) and main layout shell (AppLayout.tsx)
  pages/        One folder per page; owns its sub-components, dialogs, and hooks
  components/   Shared UI building blocks reused across pages
  hooks/        Global hooks (auth, categories, data fetching)
  api/          Thin API client functions — one file per domain
  lib/          Pure utility functions with no React dependency
  types/        Zod schemas and TypeScript types (single source of truth)
  theme/        MUI theme config and design-token helpers
  test/         Vitest global setup
```

### Detailed breakdown

```
src/
  app/
    App.tsx               Auth gate — renders AuthPage or AppLayout
    AppLayout.tsx         Tab navigation, dialog orchestration, layout shell
    AppLayout.styles.ts

  pages/
    auth/
      AuthPage.tsx
      AuthPage.styles.ts
    dashboard/
      DashboardPage.tsx
      components/         DashboardGoalCard, MonthStatCards, RecentExpensesSection, SmartEntryCard
      dialogs/
        GoalSetupDialog.tsx
    expenses/
      ExpensesPage.tsx
      ExpensesList.tsx
      ExpensesPage.styles.ts
      dialogs/
        ExpenseEditorDialog.tsx
      hooks/
        use-expense-editor.ts
        use-expense-filters.ts
    categories/
      CategoriesPage.tsx
    reports/
      ReportsPage.tsx

  components/
    DateFilter.tsx            Date preset + custom range picker
    CategoryColorSwatch.tsx   Colored dot/swatch for category display
    ExpenseRow.tsx            Reusable expense list row

  hooks/
    use-auth.ts               Session state, login/logout, token-expired listener
    use-categories.ts         Fetches + mutates category list, builds palette
    use-date-filter.ts        Date preset/range state machine
    use-dashboard-expenses.ts Paginated expense fetch for dashboard

  api/
    client.ts     Base fetch wrapper — 401 handling, token refresh, error envelope
    auth.ts       login / register / logout
    expenses.ts   CRUD + paginated list
    categories.ts predefined + custom category endpoints
    goals.ts      goal CRUD
    reports.ts    monthly + by-category aggregates
    ai.ts         AI expense text parsing

  lib/
    categories.ts    Category resolution and allowlist helpers
    date-filter.ts   Preset date range calculations
    expense-ui.ts    Formatting, chart series builders, category palette helpers
    goal-status.ts   Progress and chip label logic for goal cards
    storage.ts       localStorage access for auth tokens and user
    env.ts           VITE_API_BASE_URL validation and export

  types/
    index.ts         All Zod schemas + inferred TypeScript types

  theme/
    theme.ts         MUI createTheme — dark palette, typography, component overrides
    ui.ts            Design tokens: RADIUS_*, surfaceCard(), sectionLabelSx(), etc.
```

---

## Architecture

### Authentication flow

`App.tsx` reads `useAuth()` on every render. If there is no access token the `AuthPage` is shown. After login `saveSession()` writes both tokens and the user object to `localStorage` and updates React state in one call.

```
AuthPage ──onAuthenticated──▶ useAuth.saveSession() ──▶ AppLayout rendered
```

Token refresh is handled transparently inside the API client:

1. A 401 response on a protected endpoint triggers `POST /auth/refresh` automatically.
2. If the refresh succeeds the original request is retried once with the new token.
3. If the refresh fails, `localStorage` is cleared and a `CustomEvent("auth:session-expired")` is dispatched on `window`.
4. `useAuth` listens for that event and sets `isAuthenticated = false`, which unmounts the app and renders the login screen.

> Public paths (`/auth/login`, `/auth/register`, `/auth/refresh`) are excluded from the refresh loop to prevent infinite retry.

If a protected request returns **401** and there is **no refresh token** (e.g. storage was edited), the client still calls `forceSignOut()` so React returns to the login screen instead of staying in a broken “authenticated” state.

### Data fetching

All server state lives in **React Query**. Query keys follow a flat convention:

| Key | Data |
|---|---|
| `["categories"]` | Predefined + custom category list |
| `["goals"]` | Current monthly goal |
| `["expenses"]` | Paginated expense list |
| `["reports"]` | Monthly and by-category aggregates |

Mutations that modify data affecting other queries call `queryClient.invalidateQueries` explicitly. Some mutations (category add/update/delete) also use optimistic `setQueryData` to avoid a round-trip.

### Dialog management

App-level dialogs (`ExpenseEditorDialog`, `GoalSetupDialog`) are rendered once inside `AppLayout` and controlled by boolean open state + a session counter. The session counter is incremented every time the dialog is opened so the `key` changes, which resets internal form state without needing `useEffect`.

Page-specific dialogs live in `pages/[page]/dialogs/` and are kept close to the feature that owns them.

---

## Styling

All component styles use the **MUI `styled()` API** with collocated `.styles.ts` files. Plain `sx` prop is reserved for one-off layout adjustments that don't warrant their own styled component.

### Conventions

- Every component `Foo.tsx` that needs non-trivial styling has a sibling `Foo.styles.ts`.
- Styled components in `.styles.ts` are named after what they represent (e.g. `DialogHeader`, `CategoryDot`), not after HTML tags.
- Transient styled props use the `$` prefix (`$isActive`, `$color`) and are blocked from reaching the DOM via `shouldForwardProp`.
- Use design tokens from `src/theme/ui.ts` instead of hardcoded pixel values for radii and surfaces.

```ts
// Good — uses token, transient prop, shouldForwardProp
export const ChartBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isActive" && prop !== "$heightPx",
})<{ $isActive: boolean; $heightPx: number }>(({ theme, $isActive, $heightPx }) => ({
  height: $heightPx,
  borderRadius: RADIUS_INNER,
  backgroundColor: $isActive
    ? theme.palette.primary.main
    : alpha(theme.palette.primary.main, 0.3),
}));

// Avoid — inline sx for structural style
<Box sx={{ height: 40, borderRadius: "8px", bgcolor: "primary.main" }} />
```

---

## Coding conventions

### TypeScript

- Prefer explicit return types on exported functions and hooks.
- Use `type` imports (`import type { Foo }`) for type-only symbols.
- Avoid `any`; use `unknown` and narrow with guards or Zod.
- All API request/response shapes are defined as Zod schemas in `src/types/index.ts` — derive TS types with `z.infer<>`, never write them by hand.

### Components

- Named exports only — no default exports.
- One component per file.
- Props type defined inline above the component with a `Props` suffix: `type FooProps = { ... }`.
- Keep components focused. If a component needs to know how to fetch its own data, extract a hook.

### Hooks

- Hooks live in `src/hooks/` if used by multiple pages, or in `pages/[page]/hooks/` if page-local.
- Each hook should have a single, clear responsibility.
- Side effects that invalidate queries belong in `onSuccess` callbacks on mutations, not in `useEffect`.

### API layer

- Files in `src/api/` are thin wrappers around `apiRequest` / `apiGetAllow404`.
- No business logic in API files — they map function arguments to HTTP calls and return typed data.
- Use `apiGetAllow404` for endpoints that return 404 when no data exists (e.g. `GET /goals`).

### Naming

| Pattern | Example |
|---|---|
| Page component | `ExpensesPage` |
| Dialog component | `ExpenseEditorDialog` |
| Reusable component | `ExpenseRow`, `DateFilter` |
| Hook | `useExpenseEditor`, `useDateFilter` |
| Styled component | `DialogHeader`, `CategoryDot` |
| Utility file | `expense-ui.ts`, `goal-status.ts` |
| Test file | `Component.test.tsx`, `hook.test.ts` |

---

## Testing

Tests live next to the file they cover with a `.test.ts` / `.test.tsx` suffix. The test runner is Vitest with jsdom.

### Setup

`src/test/setup.ts` imports `@testing-library/jest-dom/vitest` matchers and calls `cleanup()` after each test.

### Test scope

| Layer | What is covered |
|---|---|
| `lib/` utilities | Pure logic: date ranges, category resolution, goal status |
| `api/client.ts` | 401 refresh retry, refresh failure → session-expired event, public path exclusions, 404 handling, error envelope parsing |
| `hooks/use-auth` | Session init from storage, session-expired event, logout on API failure |
| `hooks/use-expense-editor` | Parse-to-form mapping, create/update/delete mutations, cache invalidation |
| `hooks/use-expense-filters` | Default state, category name → ID mapping |
| UI components | `DateFilter`, `ExpensesPage`, `ExpenseEditorDialog`, `GoalSetupDialog` |

### Patterns

- Use `vi.mock()` at the module level to stub API calls. Reset mocks in `beforeEach` to prevent count bleed.
- Wrap components that use `useMediaQuery` or mutation hooks in `ThemeProvider` + `QueryClientProvider`.
- Pass a fresh `QueryClient` per test with `retry: false` to prevent spurious retries.
- Prefer `userEvent` over `fireEvent` for interactions; use `fireEvent` only for events that `userEvent` cannot simulate (e.g. date input changes).

```ts
const renderWithProviders = (ui: ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    createElement(ThemeProvider, { theme },
      createElement(QueryClientProvider, { client }, ui)
    )
  );
};
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API root, **no trailing slash**. Local: e.g. `http://localhost:3001` (serverless-offline). Production: API Gateway invoke URL from `serverless deploy` output. |

Copy from `.env.example`:

```bash
copy packages\frontend\.env.example packages\frontend\.env
```
