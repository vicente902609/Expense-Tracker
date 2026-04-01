import { useEffect, useState } from "react";
import type { AuthSessionData, PublicUser } from "@expense-tracker/shared";

import { logout as logoutApi } from "@/api/auth";
import { AUTH_STORAGE_KEYS, authStorage } from "@/lib/storage";

const readSessionFromStorage = (): { accessToken: string | null; user: PublicUser | null } => ({
  accessToken: authStorage.getAccessToken(),
  user: authStorage.getUser(),
});

export const useAuth = () => {
  const [{ accessToken, user }, setSession] = useState(readSessionFromStorage);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === AUTH_STORAGE_KEYS.access ||
        event.key === AUTH_STORAGE_KEYS.refresh ||
        event.key === AUTH_STORAGE_KEYS.user
      ) {
        setSession(readSessionFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveSession = (session: AuthSessionData) => {
    authStorage.setTokens(session.tokens.accessToken, session.tokens.refreshToken);
    authStorage.setUser(session.user);
    setSession({ accessToken: session.tokens.accessToken, user: session.user });
  };

  const clearSession = () => {
    authStorage.clearSession();
    setSession({ accessToken: null, user: null });
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // still clear local session
    }
    clearSession();
  };

  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    user,
    saveSession,
    clearSession,
    logout,
  };
};
