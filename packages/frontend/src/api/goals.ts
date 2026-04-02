import type { Goal, GoalCreateBody, GoalUpdateBody } from "@expense-tracker/shared";

import { apiGetAllow404, apiRequest } from "@/api/client";

export const getGoal = () => apiGetAllow404<Goal>("/goals");

export const createGoal = (payload: GoalCreateBody) => apiRequest<Goal>("/goals", { method: "POST", body: payload });

export const updateGoal = (payload: GoalUpdateBody) => apiRequest<Goal>("/goals", { method: "PUT", body: payload });

export const deleteGoal = () => apiRequest<void>("/goals", { method: "DELETE" });
