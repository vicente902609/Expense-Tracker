import { env } from "../../config/env.js";
import { logOpenAiApiError } from "../ai/openai-errors.js";

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

const readResponseText = async (response: Response) => {
  const data = (await response.json()) as Record<string, unknown>;
  const outputText = data.output_text;

  if (typeof outputText === "string" && outputText.length > 0) {
    return outputText;
  }

  type OutItem = { content?: Array<{ text?: string }> };
  const output = data.output as OutItem[] | undefined;
  const candidate = output?.[0]?.content?.find((item) => typeof item.text === "string");
  return candidate?.text ?? "";
};

const buildSystemText = (): string =>
  [
    "You are a personal finance assistant. Given a monthly spending summary, write a single short insight sentence (max 2 sentences) for the user.",
    "Rules:",
    "- If currentMonthTotal <= targetExpense: tell the user they are on track, mention how much they have spent vs target.",
    "- If currentMonthTotal > targetExpense * 0.9 but <= targetExpense (within 10%): warn them they are close to the limit, mention days remaining and the top-spending category.",
    "- If currentMonthTotal > targetExpense: tell the user they are over budget by the delta, and name the specific category with the largest month-over-month increase as an action to reduce.",
    "Be friendly, specific, and actionable. Use dollar amounts (no cents unless non-zero). Return strict JSON only.",
  ].join(" ");

export const fetchExpenseInsightFromModel = async (prompt: InsightExpensePrompt): Promise<InsightExpenseModel | null> => {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const body = {
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: buildSystemText() }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(prompt) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "expense_insight",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            insight: { type: "string" },
          },
          required: ["insight"],
        },
      },
    },
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      logOpenAiApiError("Goal expense insight OpenAI HTTP error", response.status, bodyText);
      return null;
    }

    const text = await readResponseText(response);
    if (!text) {
      return null;
    }

    const parsed = JSON.parse(text) as InsightExpenseModel;
    if (typeof parsed?.insight !== "string") {
      return null;
    }
    return parsed;
  } catch (error) {
    logOpenAiApiError("Goal expense insight request failed", 0, error instanceof Error ? error.message : String(error));
    return null;
  }
};
