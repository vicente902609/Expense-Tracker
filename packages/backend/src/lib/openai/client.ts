/** Generic OpenAI Responses API client. */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OpenAICallOptions {
  systemText: string;
  userText: string;
  /** JSON Schema definition used to constrain the model's response format. */
  jsonSchema: {
    name: string;
    schema: Record<string, unknown>;
  };
  apiKey: string;
  model: string;
}

type OpenAiErrorPayload = {
  error?: { message?: string; type?: string; code?: string };
};

// ── Error messages ────────────────────────────────────────────────────────────

export const MSG_AI_NOT_AVAILABLE =
  "Expense parsing isn't available right now. Please enter the details manually.";

export const MSG_AI_PARSE_FAILED =
  "We couldn't parse that right now. Please try again, or enter the amount, date, and category yourself.";

const logError = (context: string, status: number, bodyText: string) => {
  console.error(`[ai] ${context}`, { status, body: bodyText.slice(0, 4000) });
};

const parseErrorBody = (bodyText: string): OpenAiErrorPayload | null => {
  try {
    return JSON.parse(bodyText) as OpenAiErrorPayload;
  } catch {
    return null;
  }
};

const userMessageForHttpError = (status: number, bodyText: string): string => {
  const parsed = parseErrorBody(bodyText);
  const code = parsed?.error?.code;
  const type = parsed?.error?.type;

  if (status === 401 || status === 403) return MSG_AI_NOT_AVAILABLE;
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (code === 'model_not_found' || code === 'invalid_model') return MSG_AI_PARSE_FAILED;
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') return MSG_AI_NOT_AVAILABLE;
  if (code === 'context_length_exceeded') return 'That text is too long to parse. Try a shorter description.';
  if (type === 'invalid_request_error' && status >= 400 && status < 500) return MSG_AI_PARSE_FAILED;
  if (status >= 500) return 'The parsing service is temporarily unavailable. Please try again in a moment or enter the details manually.';
  return MSG_AI_PARSE_FAILED;
};

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Calls the OpenAI Responses API with a structured JSON-schema response format.
 * Returns the parsed response body typed as T, or null if the model returned empty output.
 * Throws an Error with a `statusCode` property on HTTP or JSON parse failures.
 */
export const callOpenAI = async <T>(options: OpenAICallOptions): Promise<T | null> => {
  const body = {
    model: options.model,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: options.systemText }],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: options.userText }],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: options.jsonSchema.name,
        schema: options.jsonSchema.schema,
      },
    },
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.apiKey}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    logError('OpenAI API error', response.status, bodyText);
    const message = userMessageForHttpError(response.status, bodyText);
    const httpStatus = response.status === 429 ? 429 : 502;
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = httpStatus;
    throw err;
  }

  const data = await response.json() as Record<string, unknown>;
  const outputText =
    typeof data.output_text === 'string' && data.output_text.length > 0
      ? data.output_text
      : ((data.output as Array<{ content?: Array<{ text?: string }> }> | undefined)?.[0]?.content?.find(
          (item) => typeof item.text === 'string',
        )?.text ?? '');

  if (!outputText) return null;

  try {
    return JSON.parse(outputText) as T;
  } catch {
    logError('Failed to parse AI JSON output', 200, outputText);
    const err = new Error(MSG_AI_PARSE_FAILED) as Error & { statusCode: number };
    err.statusCode = 502;
    throw err;
  }
};
