import type { Goal, GoalInput } from "@expense-tracker/shared";

import { apiRequest } from "./client.js";

export const listGoals = () => apiRequest<Goal[]>("/goals");
export const createGoal = (payload: GoalInput) => apiRequest<Goal>("/goals", { method: "POST", body: payload });
export const updateGoal = (goalId: string, payload: GoalInput) => apiRequest<Goal>(`/goals/${goalId}`, { method: "PUT", body: payload });
