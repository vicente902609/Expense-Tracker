import type { PublicUser } from "@expense-tracker/shared";

const accessKey = "expense-tracker-access-token";
const refreshKey = "expense-tracker-refresh-token";
const userKey = "expense-tracker-user";
/** Legacy single JWT from older clients; cleared on read */
const legacyTokenKey = "expense-tracker-token";

function normalizeStoredUser(raw: unknown): PublicUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.userId === "string" && typeof o.email === "string" && typeof o.name === "string") {
    return {
      userId: o.userId,
      email: o.email,
      name: o.name,
      createdAt: String(o.createdAt ?? ""),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : String(o.createdAt ?? ""),
    };
  }
  if (typeof o.id === "string") {
    return {
      userId: o.id,
      email: String(o.email ?? ""),
      name: String(o.name ?? ""),
      createdAt: String(o.createdAt ?? ""),
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : String(o.createdAt ?? ""),
    };
  }
  return null;
}

function clearLegacyTokenIfPresent() {
  if (window.localStorage.getItem(legacyTokenKey)) {
    window.localStorage.removeItem(legacyTokenKey);
    window.localStorage.removeItem(userKey);
  }
}

export const authStorage = {
  getAccessToken: () => {
    clearLegacyTokenIfPresent();
    return window.localStorage.getItem(accessKey);
  },

  getRefreshToken: () => {
    clearLegacyTokenIfPresent();
    return window.localStorage.getItem(refreshKey);
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    window.localStorage.setItem(accessKey, accessToken);
    window.localStorage.setItem(refreshKey, refreshToken);
  },

  getUser: (): PublicUser | null => {
    clearLegacyTokenIfPresent();
    const raw = window.localStorage.getItem(userKey);
    if (!raw) {
      return null;
    }
    try {
      return normalizeStoredUser(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  setUser: (user: PublicUser) => {
    window.localStorage.setItem(userKey, JSON.stringify(user));
  },

  clearSession: () => {
    window.localStorage.removeItem(accessKey);
    window.localStorage.removeItem(refreshKey);
    window.localStorage.removeItem(userKey);
    window.localStorage.removeItem(legacyTokenKey);
  },
};
