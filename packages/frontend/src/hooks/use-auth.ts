import { useState } from "react";
import type { AuthSessionData, PublicUser } from "@expense-tracker/shared";

import { logout as logoutApi } from "@/api/auth";
import { authStorage } from "@/lib/storage";

export const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(() => authStorage.getAccessToken());
  const [user, setUser] = useState<PublicUser | null>(() => authStorage.getUser());

  const saveSession = (session: AuthSessionData) => {
    authStorage.setTokens(session.tokens.accessToken, session.tokens.refreshToken);
    authStorage.setUser(session.user);
    setAccessToken(session.tokens.accessToken);
    setUser(session.user);
  };

  const clearSession = () => {
    authStorage.clearSession();
    setAccessToken(null);
    setUser(null);
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
