import type { ParsedExpense } from "@expense-tracker/shared";

import { apiRequest } from "./client.js";

export const parseExpenseText = (text: string) =>
  apiRequest<ParsedExpense>("/ai/parse-expense", {
    method: "POST",
    body: {
      text,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
