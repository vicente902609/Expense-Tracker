import type { ParsedExpense } from "@/types";

import { apiRequest } from "@/api/client";
import { formatLocalIsoDate } from "@/lib/expense-ui";

export const parseExpenseText = (text: string) =>
  apiRequest<ParsedExpense>("/ai/parse-expense", {
    method: "POST",
    body: {
      text,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referenceDate: formatLocalIsoDate(new Date()),
    },
  });
