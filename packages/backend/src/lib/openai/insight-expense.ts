/** Insight-expense prompt definition for the OpenAI client. */

import type { OpenAICallOptions } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightExpensePrompt = {
  targetExpense: number;
  currentMonthTotal: number;
  prevMonthTotal: number;
  daysRemainingInMonth: number;
  categories: Array<{
    name: string;
    currentAmount: number;
    prevAmount: number;
  }>;
};

export type InsightExpenseModel = {
  insight: string;
};

// ── JSON Schema ───────────────────────────────────────────────────────────────

const INSIGHT_EXPENSE_JSON_SCHEMA = {
  name: 'expense_insight',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      insight: { type: 'string' },
    },
    required: ['insight'],
  } as Record<string, unknown>,
};

// ── Prompt builder ────────────────────────────────────────────────────────────

const buildSystemText = (): string =>
  [
    'You are a personal finance assistant. Given a monthly spending summary, write a concise insight (max 2 sentences) for the user.',
    'Rules:',
    '- If currentMonthTotal < targetExpense * 0.9 (well within budget): state how much has been spent vs the target.',
    '  If daysRemainingInMonth > 0, compute the daily allowance: (targetExpense - currentMonthTotal) / daysRemainingInMonth and tell the user how much they can spend per day for the rest of the month.',
    '  If daysRemainingInMonth = 0, congratulate them on finishing under budget.',
    '- If currentMonthTotal >= targetExpense * 0.9 and currentMonthTotal <= targetExpense (within 10% of target): warn that the budget is nearly exhausted.',
    '  State the exact amount remaining and, if daysRemainingInMonth > 0, the strict daily limit to stay within budget.',
    '  Name the top-spending category as the one to watch.',
    '- If currentMonthTotal > targetExpense (over budget): tell the user they are over budget by the delta (currentMonthTotal - targetExpense).',
    '  Name the category with the largest month-over-month increase and suggest reducing it.',
    '  If daysRemainingInMonth > 0, note that no further spending is available within the budget.',
    'Be friendly, specific, and actionable. Use dollar amounts (no cents unless the cent value is non-zero). Return strict JSON only.',
  ].join(' ');

/**
 * Builds `OpenAICallOptions` for the insight-expense prompt.
 * Pass the result directly to `callOpenAI<InsightExpenseModel>()`.
 */
export const buildInsightExpenseOptions = (
  prompt: InsightExpensePrompt,
  apiKey: string,
  model: string,
): OpenAICallOptions => ({
  systemText: buildSystemText(),
  userText: JSON.stringify(prompt),
  jsonSchema: INSIGHT_EXPENSE_JSON_SCHEMA,
  apiKey,
  model,
});
