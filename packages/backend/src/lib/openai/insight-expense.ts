/** Insight-expense prompt definition for the OpenAI client. */

import type { OpenAICallOptions } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightExpensePrompt = {
  targetExpense: number;
  currentMonthTotal: number;
  prevMonthTotal: number;
  totalDaysInMonth: number;
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
    'You are a personal finance assistant. Given a monthly spending summary, write a concise insight (max 3 sentences) for the user.',

    'Step 1 — Compute derived values before evaluating rules:',
    '  daysElapsed = totalDaysInMonth - daysRemainingInMonth (minimum 1).',
    '  avgDailySpend = currentMonthTotal / daysElapsed.',
    '  projectedMonthTotal = avgDailySpend * totalDaysInMonth.',
    '  allowedDailySpend = targetExpense / totalDaysInMonth.',
    '  trendDelta = currentMonthTotal - prevMonthTotal (positive = spending more than last month).',
    '  For each category compute categoryTrend = currentAmount - prevAmount.',

    'Step 2 — Identify the trend context (use in every rule where relevant):',
    '  If trendDelta > 0: the user is spending more than last month; name the category with the highest positive categoryTrend as the trend driver.',
    '  If trendDelta <= 0: the user is spending less than or equal to last month; this is a positive signal — mention it briefly when relevant.',

    'Step 3 — Apply the first matching rule and include recommended actions if the rule is a warning or alert:',

    '- OVER BUDGET: currentMonthTotal > targetExpense.',
    '  State they are over budget by (currentMonthTotal - targetExpense).',
    '  Reference the trend: if trendDelta > 0, name the trend-driver category and the increase vs last month.',
    '  Recommended actions: (a) name the single category with the highest positive categoryTrend and suggest a specific cut (e.g. "reduce [category] spend — it is $X more than last month"); (b) if daysRemainingInMonth > 0, state no further budget is available and suggest deferring non-essential purchases.',

    '- OVER PACE ALERT: currentMonthTotal <= targetExpense but avgDailySpend > allowedDailySpend.',
    '  State current avg spend/day vs allowed rate and the projected month total.',
    '  Reference the trend: if trendDelta > 0, name the trend-driver category driving the acceleration.',
    '  Recommended actions: (a) name the trend-driver category (or top current category if trend is flat) and suggest a specific reduction; (b) state the reduced daily limit for the rest of the month: (targetExpense - currentMonthTotal) / daysRemainingInMonth.',

    '- NEAR LIMIT: currentMonthTotal >= targetExpense * 0.9 and pace is fine.',
    '  State the exact amount remaining.',
    '  Reference the trend: if trendDelta > 0, note spending is higher than last month and name the driver category.',
    '  Recommended actions: name the top-spending category and suggest keeping it flat for the remainder of the month; give the daily limit if daysRemainingInMonth > 0.',

    '- ON TRACK: currentMonthTotal < targetExpense * 0.9 and pace is fine.',
    '  Confirm they are on track and state amount spent vs target.',
    '  If trendDelta <= 0: acknowledge the improvement vs last month as a positive reinforcement.',
    '  If trendDelta > 0 and the trend driver category increase is significant (> 15% of targetExpense): give a gentle heads-up naming that category.',
    '  If daysRemainingInMonth > 0: state the remaining daily allowance. If daysRemainingInMonth = 0: congratulate them.',

    'Tone: friendly, specific, and actionable. Use dollar amounts (no cents unless non-zero). Never repeat the same amount twice. Return strict JSON only.',
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
