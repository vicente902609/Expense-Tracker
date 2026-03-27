import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { parseExpenseText } from "./service.js";

export const aiRouter = Router();

aiRouter.post(
  "/parse-expense",
  asyncHandler(async (request, response) => {
    const parsedExpense = await parseExpenseText(request.body);
    response.json(parsedExpense);
  }),
);
