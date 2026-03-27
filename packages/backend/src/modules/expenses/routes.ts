import { Router } from "express";

import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import { createUserExpense, deleteUserExpense, listUserExpenses, updateUserExpense } from "./service.js";

export const expensesRouter = Router();

const getRouteParam = (value: string | string[] | undefined) => {
  if (typeof value !== "string") {
    throw new AppError("Invalid expense id", 400);
  }

  return value;
};

expensesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const expenses = await listUserExpenses(request.authUser!.id, request.query);
    response.json(expenses);
  }),
);

expensesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const expense = await createUserExpense(request.authUser!.id, request.body);
    response.status(201).json(expense);
  }),
);

expensesRouter.put(
  "/:expenseId",
  asyncHandler(async (request, response) => {
    const expense = await updateUserExpense(request.authUser!.id, getRouteParam(request.params.expenseId), request.body);
    response.json(expense);
  }),
);

expensesRouter.delete(
  "/:expenseId",
  asyncHandler(async (request, response) => {
    await deleteUserExpense(request.authUser!.id, getRouteParam(request.params.expenseId));
    response.status(204).send();
  }),
);
