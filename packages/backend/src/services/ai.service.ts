import { buildParseExpenseOptions, callOpenAI, MSG_AI_NOT_AVAILABLE, MSG_AI_PARSE_FAILED } from '../lib/openai';
import type { ParsedExpenseModel } from '../lib/openai';
import {
  listCustomCategoriesByUser,
  listPredefinedCategories,
} from '../repositories/category.repository';

// ── Category helpers (inline — no shared package dep) ─────────────────────────

const buildAllowlist = (predefined: string[], custom: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...predefined, ...custom]) {
    const c = raw.trim();
    if (!c) continue;
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
};

const resolveCategory = (raw: string | null | undefined, allowlist: readonly string[]): string => {
  if (!raw?.trim()) return 'Other';
  const trimmed = raw.trim();
  const exact = allowlist.find((c) => c === trimmed);
  if (exact) return exact;
  const ci = allowlist.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return ci ?? 'Other';
};

// ── Date helper ────────────────────────────────────────────────────────────────

export const getCalendarDateInTimezone = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // invalid timezone — fall through to UTC
  }
  return new Date().toISOString().slice(0, 10);
};

// ── Service ────────────────────────────────────────────────────────────────────

export interface ParseExpenseInput {
  text: string;
  timezone: string;
  referenceDate?: string;
}

export interface ParseExpenseResult {
  amount: number | null;
  description: string | null;
  category: string;
  date: string | null;
  confidence: number;
  notes: string[];
}

const isHttpError = (err: unknown): err is Error & { statusCode: number } =>
  err instanceof Error && typeof (err as unknown as Record<string, unknown>).statusCode === 'number';

export const parseExpense = async (
  userId: string,
  input: ParseExpenseInput,
): Promise<ParseExpenseResult> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  const model = process.env.OPENAI_MODEL?.trim() ?? '';

  if (!apiKey || !model) {
    console.error('[parse-expense] Missing OPENAI_API_KEY or OPENAI_MODEL');
    const err = new Error(MSG_AI_NOT_AVAILABLE) as Error & { statusCode: number };
    err.statusCode = 503;
    throw err;
  }

  const [predefinedItems, customItems] = await Promise.all([
    listPredefinedCategories(),
    listCustomCategoriesByUser(userId),
  ]);

  const allowlist = buildAllowlist(
    predefinedItems.map((i) => i.name),
    customItems.map((i) => i.name),
  );

  const referenceDate = input.referenceDate ?? getCalendarDateInTimezone(input.timezone);

  let modelResult: ParsedExpenseModel | null;
  try {
    modelResult = await callOpenAI<ParsedExpenseModel>(
      buildParseExpenseOptions(
        { text: input.text, referenceDate, timezone: input.timezone, categories: allowlist },
        apiKey,
        model,
      ),
    );
  } catch (err) {
    if (isHttpError(err)) throw err;
    console.error('[parse-expense] Unexpected error', err);
    const wrapped = new Error(MSG_AI_PARSE_FAILED) as Error & { statusCode: number };
    wrapped.statusCode = 502;
    throw wrapped;
  }

  if (!modelResult) {
    console.error('[parse-expense] Empty model result');
    const err = new Error(MSG_AI_PARSE_FAILED) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }

  return {
    amount: modelResult.amount,
    description: modelResult.description,
    category: resolveCategory(modelResult.category, allowlist),
    date: modelResult.date,
    confidence: modelResult.confidence,
    notes: modelResult.notes,
  };
};
