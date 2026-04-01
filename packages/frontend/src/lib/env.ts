const rawBase = import.meta.env.VITE_API_BASE_URL;

if (!rawBase) {
  const message =
    "VITE_API_BASE_URL is required. Copy packages/frontend/.env.example to packages/frontend/.env and set the API base URL.";
  console.error("[env] %s", message);
  throw new Error(message);
}

/** Matches serverless HTTP API root (no trailing slash); also works with `.../api/v1` for local Express. */
const apiBaseUrl = String(rawBase).replace(/\/+$/u, "");

export const env = {
  apiBaseUrl,
} as const;
