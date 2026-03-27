import type { ParsedExpense } from "@expense-tracker/shared";

import { env } from "../../config/env.js";

type ParseExpensePrompt = {
  text: string;
  resolvedDate: string | null;
  matchedDateExpression: string | null;
  categories: string[];
};

const toJsonBody = (input: ParseExpensePrompt) => ({
  model: env.OPENAI_MODEL,
  input: [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text: "Extract a structured expense object. Return strict JSON only with keys amount, description, category, date, confidence, notes. If a field is uncertain, return null instead of guessing.",
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
