import type { ParsedExpense } from "@expense-tracker/shared";

import { env } from "../../config/env.js";

type ParseExpensePrompt = {
  text: string;
  resolvedDate: string | null;
  matchedDateExpression: string | null;
  categories: string[];
};

const categoryInstruction = (categories: string[]) =>
  [
    "Extract one expense from the user's text. Return strict JSON only with keys amount, description, category, date, confidence, notes.",
    `The "category" field MUST be exactly one of these strings (built-in labels plus this user's custom categories — use exact spelling from the list): ${categories.join(" | ")}.`,
    'If the purchase does not clearly fit any label, use "Other".',
    "amount, description, date: use null if uncertain. confidence: 0–1. notes: short strings about assumptions.",
  ].join(" ");

const toJsonBody = (input: ParseExpensePrompt) => ({
  model: env.OPENAI_MODEL,
  input: [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: categoryInstruction(input.categories),
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
});

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
    const message = await response.text();
    throw new Error(`AI parse request failed: ${message}`);
  }

  const text = await readResponseText(response);

  if (!text) {
    return null;
  }

  return JSON.parse(text) as ParsedExpense;
};
