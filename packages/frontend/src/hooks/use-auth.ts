import { useState } from "react";
import type { User } from "@expense-tracker/shared";

import { authStorage } from "@/lib/storage";

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());

  const saveSession = (nextToken: string, nextUser: User) => {
    authStorage.setToken(nextToken);
    authStorage.setUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setToken(null);
    setUser(null);
  };

  return {
    isAuthenticated: Boolean(token),
    token,
    user,
    saveSession,
    clearSession,
  };
};
