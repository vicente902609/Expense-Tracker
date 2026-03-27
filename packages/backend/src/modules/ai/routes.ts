import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { parseExpenseText } from "./parse-expense.js";

export const aiRouter = Router();

aiRouter.post(
  "/parse-expense",
  asyncHandler(async (request, response) => {
    const parsedExpense = await parseExpenseText(request.body, request.authUser!.id);
    response.json(parsedExpense);
  }),
);
