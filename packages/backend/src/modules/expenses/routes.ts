import { Router } from "express";

import { sendCreated, sendOk } from "../../lib/api-response.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import {
  createUserExpense,
  deleteUserExpense,
  getUserExpense,
  listUserExpenses,
  updateUserExpense,
} from "./service.js";

export const expensesRouter = Router();

const getRouteParam = (value: string | string[] | undefined) => {
  if (typeof value !== "string") {
    throw new AppError("Invalid expense id", 400);
  }

  return decodeURIComponent(value);
};

expensesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const result = await listUserExpenses(request.authUser!.id, request.query);
    sendOk(response, result);
  }),
);

expensesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const expense = await createUserExpense(request.authUser!.id, request.body);
    sendCreated(response, expense);
  }),
);

expensesRouter.get(
  "/:expenseId",
  asyncHandler(async (request, response) => {
    const expense = await getUserExpense(request.authUser!.id, getRouteParam(request.params.expenseId));
    sendOk(response, expense);
  }),
);

expensesRouter.put(
  "/:expenseId",
  asyncHandler(async (request, response) => {
    const expense = await updateUserExpense(request.authUser!.id, getRouteParam(request.params.expenseId), request.body);
    sendOk(response, expense);
  }),
);

expensesRouter.delete(
  "/:expenseId",
  asyncHandler(async (request, response) => {
    const result = await deleteUserExpense(request.authUser!.id, getRouteParam(request.params.expenseId));
    sendOk(response, result);
  }),
);
