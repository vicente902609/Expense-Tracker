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
    'You are a personal finance assistant. Given a monthly spending summary, write a single short insight sentence (max 2 sentences) for the user.',
    'Rules:',
    '- If currentMonthTotal <= targetExpense: tell the user they are on track, mention how much they have spent vs target.',
    '- If currentMonthTotal > targetExpense * 0.9 but <= targetExpense (within 10%): warn them they are close to the limit, mention days remaining and the top-spending category.',
    '- If currentMonthTotal > targetExpense: tell the user they are over budget by the delta, and name the specific category with the largest month-over-month increase as an action to reduce.',
    'Be friendly, specific, and actionable. Use dollar amounts (no cents unless non-zero). Return strict JSON only.',
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
