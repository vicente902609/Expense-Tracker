const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  const message =
    "VITE_API_BASE_URL is required. Copy packages/frontend/.env.example to packages/frontend/.env and set the API base URL.";
  console.error("[env] %s", message);
  throw new Error(message);
}

export const env = {
  apiBaseUrl,
} as const;
