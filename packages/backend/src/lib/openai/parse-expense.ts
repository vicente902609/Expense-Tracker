/** Parse-expense prompt definition for the OpenAI client. */

import type { OpenAICallOptions } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParseExpensePrompt = {
  text: string;
  referenceDate: string;
  timezone: string;
  categories: string[];
};

export type ParsedExpenseModel = {
  amount: number | null;
  description: string | null;
  category: string | null;
  date: string | null;
  confidence: number;
  notes: string[];
};

// ── JSON Schema ───────────────────────────────────────────────────────────────

const PARSE_EXPENSE_JSON_SCHEMA = {
  name: 'parsed_expense',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      amount: { type: ['number', 'null'] },
      description: { type: ['string', 'null'] },
      category: { type: ['string', 'null'] },
      date: { type: ['string', 'null'] },
      confidence: { type: 'number' },
      notes: { type: 'array', items: { type: 'string' } },
    },
    required: ['amount', 'description', 'category', 'date', 'confidence', 'notes'],
  } as Record<string, unknown>,
};

// ── Prompt builder ────────────────────────────────────────────────────────────

const weekdayFromIsoDate = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
};

const buildSystemText = (categories: string[], referenceDate: string): string => {
  const referenceWeekday = weekdayFromIsoDate(referenceDate);
  return [
    'Extract one expense from the user\'s text. Return strict JSON only with keys amount, description, category, date, confidence, notes.',
    'Interpret natural-language dates (e.g. "yesterday", "last weekend", "last Friday") using referenceDate and timezone.',
    'referenceDate is the user\'s calendar today (YYYY-MM-DD) in that IANA timezone — not server UTC. Resolve relative dates against that day in that zone.',
    'Resolve all date phrases with one consistent rule set (do not use special-case heuristics by phrase type).',
    'If the user mentions a weekday (e.g. "Sunday"), the returned date MUST be that exact weekday in the given timezone.',
    'For "last <weekday>", choose the most recent past occurrence before referenceDate (never a future date).',
    'Before returning JSON, verify weekday/date consistency and correct it if needed.',
    'Return "date" as the expense calendar day in YYYY-MM-DD (same convention: the user\'s local calendar, aligned with timezone). Use null if uncertain.',
    `The "category" field MUST be exactly one of these strings (use exact spelling): ${categories.join(' | ')}.`,
    'If the purchase does not clearly fit any label, use "Other".',
    'description should be concise and user-friendly (for example: "Lunch with client"), not a verbatim copy.',
    'amount, description, date: use null if uncertain. confidence: 0-1. notes: short strings about assumptions.',
    `Example relative to referenceDate=${referenceDate} (${referenceWeekday}): "last Sunday" => most recent past Sunday before referenceDate.`,
    `Example relative to referenceDate=${referenceDate} (${referenceWeekday}): "last Friday" => most recent past Friday before referenceDate.`,
  ].join(' ');
};

/**
 * Builds `OpenAICallOptions` for the parse-expense prompt.
 * Pass the result directly to `callOpenAI<ParsedExpenseModel>()`.
 */
export const buildParseExpenseOptions = (
  prompt: ParseExpensePrompt,
  apiKey: string,
  model: string,
): OpenAICallOptions => ({
  systemText: buildSystemText(prompt.categories, prompt.referenceDate),
  userText: JSON.stringify(prompt),
  jsonSchema: PARSE_EXPENSE_JSON_SCHEMA,
  apiKey,
  model,
});
