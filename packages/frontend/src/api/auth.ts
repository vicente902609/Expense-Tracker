import type { AuthSessionData, LoginBody, RegisterBody } from "@expense-tracker/shared";

import { apiRequest } from "@/api/client";
import { authStorage } from "@/lib/storage";

export const register = (payload: RegisterBody) =>
  apiRequest<AuthSessionData>("/auth/register", { method: "POST", body: payload });

export const login = (payload: LoginBody) =>
  apiRequest<AuthSessionData>("/auth/login", { method: "POST", body: payload });

export const logout = () => {
  const access = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();
  if (!access || !refreshToken) {
    return Promise.resolve();
  }
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
};
