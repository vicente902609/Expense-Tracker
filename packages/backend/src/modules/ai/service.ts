import { expenseCategoryValues, parseExpenseRequestSchema, parsedExpenseSchema, type ParsedExpense } from "@expense-tracker/shared";

import { getIsoDate, parseNaturalDate } from "../../lib/date.js";
import { parseExpenseWithModel } from "./provider.js";

const fallbackCategory = (text: string) => {
  const normalized = text.toLowerCase();

  if (/(lunch|dinner|coffee|food|restaurant)/u.test(normalized)) {
    return "Food";
  }

  if (/(uber|lyft|taxi|bus|train|gas|parking)/u.test(normalized)) {
    return "Transport";
  }

  if (/(movie|concert|netflix|spotify|game)/u.test(normalized)) {
    return "Entertainment";
  }

  return null;
};

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

const buildFallbackResult = (text: string, resolvedDate: string | null, matchedExpression: string | null): ParsedExpense => ({
  amount: fallbackAmount(text),
  description: fallbackDescription(text),
  category: fallbackCategory(text),
  date: resolvedDate,
  confidence: matchedExpression ? 0.72 : 0.58,
  notes: [
    "Fallback parser used.",
    ...(matchedExpression ? [`Resolved "${matchedExpression}" server-side.`] : ["No relative date detected."]),
  ],
});

export const parseExpenseText = async (payload: unknown) => {
  const input = parseExpenseRequestSchema.parse(payload);
  const referenceDate = input.referenceDate ?? getIsoDate();
  const dateContext = parseNaturalDate(input.text, referenceDate);
  const modelResult = await parseExpenseWithModel({
    text: dateContext.cleanedText,
    resolvedDate: dateContext.isoDate,
    matchedDateExpression: dateContext.matchedExpression,
    categories: [...expenseCategoryValues],
  }).catch(() => null);

  const parsed = parsedExpenseSchema.parse(modelResult ?? buildFallbackResult(dateContext.cleanedText, dateContext.isoDate, dateContext.matchedExpression));

  return {
    ...parsed,
    date: parsed.date ?? dateContext.isoDate,
    notes: dateContext.matchedExpression
      ? [...parsed.notes, `Server resolved ${dateContext.matchedExpression} to ${dateContext.isoDate}.`]
      : parsed.notes,
  };
};

type InsightSeed = {
  monthlySavingsRate: number;
  projectedEta: string | null;
  targetDate: string;
  suggestedCategoryCut: string | null;
  suggestedCutAmount: number;
  status: "on_track" | "at_risk" | "achieved" | "insufficient_data";
};

export const buildEtaInsight = async (seed: InsightSeed) => {
  if (seed.status === "insufficient_data") {
    return "Add a budget plan and at least a few expenses before we estimate your goal with confidence.";
  }

  if (seed.status === "achieved") {
    return "You have already reached this goal based on your current saved amount.";
  }

  if (seed.status === "on_track") {
    return `You're saving about $${seed.monthlySavingsRate.toFixed(0)}/month. At this pace you'll hit your goal by ${seed.projectedEta}, on or before your target date.`;
  }

  const categoryPart =
    seed.suggestedCategoryCut && seed.suggestedCutAmount > 0
      ? ` Cut ${seed.suggestedCategoryCut} by about $${seed.suggestedCutAmount}/month to recover pace.`
      : "";

  return `You're saving about $${seed.monthlySavingsRate.toFixed(0)}/month. At this pace you'll hit your goal by ${seed.projectedEta ?? "a later date than planned"}, behind your ${seed.targetDate} target.${categoryPart}`;
};
