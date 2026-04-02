import { env } from "@/lib/env";
import { authStorage } from "@/lib/storage";

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Merged after defaults; `Authorization` from the access token always wins when a token exists. */
  headers?: Record<string, string>;
};

const buildRequestHeaders = (options: RequestOptions, accessToken: string | null): Record<string, string> => {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

type ApiEnvelope = {
  success: boolean;
  data?: unknown;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function unwrapData<T>(json: unknown): T {
  if (json && typeof json === "object" && "success" in json) {
    const e = json as ApiEnvelope;
    if (e.success === true && "data" in e) {
      return e.data as T;
    }
  }
  return json as T;
}

function throwFromFailedResponse(json: unknown): never {
  if (json && typeof json === "object" && "success" in json) {
    const e = json as ApiEnvelope;
    if (e.success === false) {
      if (e.errors && typeof e.errors === "object") {
        const flat = Object.values(e.errors)
          .flat()
          .filter((v): v is string => Boolean(v));
        if (flat.length) {
          throw new Error(flat[0]);
        }
      }
      if (e.message) {
        throw new Error(e.message);
      }
    }
  }
  if (json && typeof json === "object" && "message" in json) {
    const m = (json as { message?: unknown }).message;
    if (typeof m === "string") {
      throw new Error(m);
    }
  }
  throw new Error("Request failed");
}

const isPublicAuthPath = (path: string) => {
  const p = path.split("?")[0] ?? path;
  return (
    p.endsWith("/auth/login") || p.endsWith("/auth/register") || p.endsWith("/auth/refresh")
  );
};

/** Dispatched on `window` when the refresh attempt fails so `useAuth` can clear React state. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired" as const;

const forceSignOut = () => {
  authStorage.clearSession();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

async function postRefresh(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    forceSignOut();
    return false;
  }

  try {
    const data = unwrapData<{ tokens: { accessToken: string; refreshToken: string } }>(json);
    if (data?.tokens?.accessToken && data?.tokens?.refreshToken) {
      authStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      return true;
    }
  } catch {
    // unwrap failed
  }

  forceSignOut();
  return false;
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> => {
  const token = authStorage.getAccessToken();
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: buildRequestHeaders(options, token),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => null);

  if (response.status === 401 && !retried && !isPublicAuthPath(path)) {
    if (authStorage.getRefreshToken()) {
      const refreshed = await postRefresh();
      if (refreshed) {
        return apiRequest<T>(path, options, true);
      }
      throw new Error("Session expired. Please sign in again.");
    }
    forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    throwFromFailedResponse(json);
  }

  return unwrapData<T>(json);
};

/** GET helper: returns `null` on HTTP 404 (e.g. no goal yet). Same refresh-token behavior as {@link apiRequest}. */
export const apiGetAllow404 = async <T>(path: string, retried = false): Promise<T | null> => {
  const token = authStorage.getAccessToken();
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "GET",
    headers: buildRequestHeaders({}, token),
  });

  if (response.status === 404) {
    return null;
  }

  const json = await response.json().catch(() => null);

  if (response.status === 401 && !retried && !isPublicAuthPath(path)) {
    if (authStorage.getRefreshToken()) {
      const refreshed = await postRefresh();
      if (refreshed) {
        return apiGetAllow404<T>(path, true);
      }
      throw new Error("Session expired. Please sign in again.");
    }
    forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    throwFromFailedResponse(json);
  }

  return unwrapData<T>(json);
};
