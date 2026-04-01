import { Router } from "express";

import { reportsRangeQuerySchema } from "@expense-tracker/shared";

import { sendOk } from "../../lib/api-response.js";
import { asyncHandler } from "../../lib/http.js";
import { getByCategoryReport, getMonthlyReport } from "./service.js";

export const reportsRouter = Router();

const firstQuery = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

reportsRouter.get(
  "/monthly",
  asyncHandler(async (request, response) => {
    const parsed = reportsRangeQuerySchema.parse({
      startDate: firstQuery(request.query.startDate),
      endDate: firstQuery(request.query.endDate),
    });
    const result = await getMonthlyReport(request.authUser!.id, parsed.startDate, parsed.endDate);
    sendOk(response, result);
  }),
);

reportsRouter.get(
  "/by-category",
  asyncHandler(async (request, response) => {
    const parsed = reportsRangeQuerySchema.parse({
      startDate: firstQuery(request.query.startDate),
      endDate: firstQuery(request.query.endDate),
    });
    const result = await getByCategoryReport(request.authUser!.id, parsed.startDate, parsed.endDate);
    sendOk(response, result);
  }),
);
