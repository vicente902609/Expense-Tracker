import type { AuthPayload, AuthResponse } from "@expense-tracker/shared";

import { apiRequest } from "./client.js";

export const register = (payload: AuthPayload) => apiRequest<AuthResponse>("/auth/register", { method: "POST", body: payload });
export const login = (payload: AuthPayload) => apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload });
