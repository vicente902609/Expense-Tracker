import { useEffect, useState } from "react";
import type { AuthSessionData, PublicUser } from "@/types";

import { logout as logoutApi } from "@/api/auth";
import { SESSION_EXPIRED_EVENT } from "@/api/client";
import { AUTH_STORAGE_KEYS, authStorage } from "@/lib/storage";

const readSessionFromStorage = (): { accessToken: string | null; user: PublicUser | null } => ({
  accessToken: authStorage.getAccessToken(),
  user: authStorage.getUser(),
});

export const useAuth = () => {
  const [{ accessToken, user }, setSession] = useState(readSessionFromStorage);

  useEffect(() => {
    // Syncs session when another tab changes localStorage (e.g. login/logout elsewhere).
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === AUTH_STORAGE_KEYS.access ||
        event.key === AUTH_STORAGE_KEYS.refresh ||
        event.key === AUTH_STORAGE_KEYS.user
      ) {
        setSession(readSessionFromStorage());
      }
    };
    // Fires in the same tab when a 401 + failed refresh forces a sign-out.
    const onSessionExpired = () => setSession({ accessToken: null, user: null });

    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
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
