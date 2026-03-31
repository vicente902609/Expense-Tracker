import {
  mergeExpenseCategoryAllowlist,
  parseExpenseRequestSchema,
  parsedExpenseSchema,
  resolveParsedExpenseCategory,
} from "@expense-tracker/shared";

import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { listCustomCategories } from "../categories/service.js";
import { getCalendarDateInTimezone, parseNaturalDate } from "../../lib/date.js";
import { USER_MESSAGE_AI_NOT_AVAILABLE, USER_MESSAGE_AI_PARSE_FAILED } from "./openai-errors.js";
import { parseExpenseWithModel } from "./provider.js";

export const parseExpenseText = async (payload: unknown, userId: string) => {
  const input = parseExpenseRequestSchema.parse(payload);
  const custom = await listCustomCategories(userId);
  const allowedCategories = mergeExpenseCategoryAllowlist(custom);
  const referenceDate = input.referenceDate ?? getCalendarDateInTimezone(input.timezone);
  const hasModelConfigured = Boolean(env.OPENAI_API_KEY?.trim()) && Boolean(env.OPENAI_MODEL?.trim());

  if (!hasModelConfigured) {
    console.error("[parse-expense] Missing OPENAI_API_KEY or OPENAI_MODEL");
    throw new AppError(USER_MESSAGE_AI_NOT_AVAILABLE, 503);
  }

  let modelResult;
  try {
    modelResult = await parseExpenseWithModel({
      text: input.text,
      referenceDate,
      timezone: input.timezone,
      categories: allowedCategories,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("[parse-expense] Unexpected error", error);
    throw new AppError(USER_MESSAGE_AI_PARSE_FAILED, 502);
  }

  if (!modelResult) {
    console.error("[parse-expense] Empty model result");
    throw new AppError(USER_MESSAGE_AI_PARSE_FAILED, 502);
  }

  const parsed = parsedExpenseSchema.parse(modelResult);
  const naturalDate = parseNaturalDate(input.text, referenceDate);
  const normalizedDate = naturalDate.isoDate ?? parsed.date;

  return {
    ...parsed,
    category: resolveParsedExpenseCategory(parsed.category, allowedCategories),
    date: normalizedDate,
    notes: parsed.notes,
  };
};
