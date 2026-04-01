import type { ParsedExpense } from "@expense-tracker/shared";

import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { logOpenAiApiError, throwOpenAiHttpError, USER_MESSAGE_AI_PARSE_FAILED } from "./openai-errors.js";

type ParseExpensePrompt = {
  text: string;
  referenceDate: string;
  timezone: string;
  categories: string[];
};

const weekdayFromIsoDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date);
};

const categoryInstruction = (categories: string[]) =>
  [
    "Extract one expense from the user's text. Return strict JSON only with keys amount, description, category, date, confidence, notes.",
    'Interpret natural-language dates (e.g. "yesterday", "last weekend", "last Friday") using referenceDate and timezone.',
    "referenceDate is the user's calendar today (YYYY-MM-DD) in that IANA timezone — not server UTC. Resolve relative dates against that day in that zone.",
    "Resolve all date phrases with one consistent rule set (do not use special-case heuristics by phrase type).",
    'If the user mentions a weekday (e.g. "Sunday"), the returned date MUST be that exact weekday in the given timezone.',
    'For "last <weekday>", choose the most recent past occurrence before referenceDate (never a future date).',
    "Before returning JSON, verify weekday/date consistency and correct it if needed.",
    'Return "date" as the expense calendar day in YYYY-MM-DD (same convention: the user\'s local calendar, aligned with timezone). Use null if uncertain.',
    `The "category" field MUST be exactly one of these strings (built-in labels plus this user's custom categories — use exact spelling from the list): ${categories.join(" | ")}.`,
    'If the purchase does not clearly fit any label, use "Other".',
    'description should be concise and user-friendly (for example: "Lunch with client"), not a verbatim copy.',
    "amount, description, date: use null if uncertain. confidence: 0-1. notes: short strings about assumptions.",
  ].join(" ");

const toJsonBody = (input: ParseExpensePrompt) => {
  const referenceWeekday = weekdayFromIsoDate(input.referenceDate);
  const weekdayExamples = [
    `Example relative to referenceDate=${input.referenceDate} (${referenceWeekday}): "last Sunday" => most recent past Sunday before referenceDate.`,
    `Example relative to referenceDate=${input.referenceDate} (${referenceWeekday}): "last Friday" => most recent past Friday before referenceDate.`,
  ].join(" ");

  return {
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `${categoryInstruction(input.categories)} ${weekdayExamples}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(input),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "parsed_expense",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            amount: { type: ["number", "null"] },
            description: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            date: { type: ["string", "null"] },
            confidence: { type: "number" },
            notes: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["amount", "description", "category", "date", "confidence", "notes"],
        },
      },
    },
  };
};

const readResponseText = async (response: Response) => {
  const data = await response.json();
  const outputText = data.output_text;

  if (typeof outputText === "string" && outputText.length > 0) {
    return outputText;
  }

  const candidate = data.output?.[0]?.content?.find((item: { text?: string }) => typeof item.text === "string");
  return candidate?.text ?? "";
};

export const parseExpenseWithModel = async (input: ParseExpensePrompt): Promise<ParsedExpense | null> => {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(toJsonBody(input)),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throwOpenAiHttpError(response.status, bodyText);
  }

  const text = await readResponseText(response);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ParsedExpense;
  } catch {
    logOpenAiApiError("Failed to parse AI JSON output", 200, text);
    throw new AppError(USER_MESSAGE_AI_PARSE_FAILED, 502);
  }
};
