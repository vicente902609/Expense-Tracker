import {
  mergeExpenseCategoryAllowlist,
  parseExpenseRequestSchema,
  parsedExpenseSchema,
  resolveParsedExpenseCategory,
  type ParsedExpense,
} from "@expense-tracker/shared";

import { listCustomCategories } from "../categories/service.js";
import { getIsoDate, parseNaturalDate } from "../../lib/date.js";
import { parseExpenseWithModel } from "./provider.js";

const fallbackAmount = (text: string) => {
  const match = text.match(/\$?(\d+(?:\.\d{1,2})?)/u);
  return match ? Number(match[1]) : null;
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const fallbackDescription = (text: string) => {
  const normalized = text.replace(/\$?\d+(?:\.\d{1,2})?/gu, "").trim();
  return normalized ? toTitleCase(normalized.slice(0, 80)) : null;
};

const buildFallbackResult = (text: string, resolvedDate: string | null, matchedExpression: string | null, allowedCategories: string[]): ParsedExpense => ({
  amount: fallbackAmount(text),
  description: fallbackDescription(text),
  category: resolveParsedExpenseCategory(text, allowedCategories),
  date: resolvedDate,
  confidence: matchedExpression ? 0.72 : 0.58,
  notes: [
    "Fallback parser used.",
    ...(matchedExpression ? [`Resolved "${matchedExpression}" server-side.`] : ["No relative date detected."]),
  ],
});

export const parseExpenseText = async (payload: unknown, userId: string) => {
  const input = parseExpenseRequestSchema.parse(payload);
  const custom = await listCustomCategories(userId);
  const allowedCategories = mergeExpenseCategoryAllowlist(custom);
  const referenceDate = input.referenceDate ?? getIsoDate();
  const dateContext = parseNaturalDate(input.text, referenceDate);
  const modelResult = await parseExpenseWithModel({
    text: dateContext.cleanedText,
    resolvedDate: dateContext.isoDate,
    matchedDateExpression: dateContext.matchedExpression,
    categories: allowedCategories,
  }).catch(() => null);

  const parsed = parsedExpenseSchema.parse(
    modelResult ?? buildFallbackResult(dateContext.cleanedText, dateContext.isoDate, dateContext.matchedExpression, allowedCategories),
  );

  return {
    ...parsed,
    category: resolveParsedExpenseCategory(parsed.category, allowedCategories),
    date: parsed.date ?? dateContext.isoDate,
    notes: dateContext.matchedExpression
      ? [...parsed.notes, `Server resolved ${dateContext.matchedExpression} to ${dateContext.isoDate}.`]
      : parsed.notes,
  };
};
