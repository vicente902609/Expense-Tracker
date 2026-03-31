import { AppError } from "../../lib/errors.js";

type OpenAiErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
    param?: string;
  };
};

/** Safe message when AI response can't be used (exported for parse-expense empty/parse failures). */
export const USER_MESSAGE_AI_PARSE_FAILED =
  "We couldn't parse that right now. Please try again, or enter the amount, date, and category yourself.";

export const USER_MESSAGE_AI_NOT_AVAILABLE = "Expense parsing isn't available right now. Please enter the details manually.";

const RATE_LIMIT = "Too many requests. Please wait a moment and try again.";

/**
 * Logs full OpenAI error details for operators. Never log to the client response.
 */
export const logOpenAiApiError = (context: string, status: number, bodyText: string) => {
  console.error(`[ai] ${context}`, { status, body: bodyText.slice(0, 4000) });
};

const parseBody = (bodyText: string): OpenAiErrorPayload | null => {
  try {
    return JSON.parse(bodyText) as OpenAiErrorPayload;
  } catch {
    return null;
  }
};

/**
 * Maps OpenAI error payloads to a safe, user-facing message (no model names or internal config).
 */
export const userMessageForOpenAiHttpError = (status: number, bodyText: string): string => {
  const parsed = parseBody(bodyText);
  const code = parsed?.error?.code;
  const type = parsed?.error?.type;

  if (status === 401 || status === 403) {
    return USER_MESSAGE_AI_NOT_AVAILABLE;
  }

  if (status === 429) {
    return RATE_LIMIT;
  }

  if (code === "model_not_found" || code === "invalid_model") {
    return USER_MESSAGE_AI_PARSE_FAILED;
  }

  if (code === "insufficient_quota" || code === "billing_hard_limit_reached") {
    return USER_MESSAGE_AI_NOT_AVAILABLE;
  }

  if (code === "context_length_exceeded") {
    return "That text is too long to parse. Try a shorter description.";
  }

  if (type === "invalid_request_error" && status >= 400 && status < 500) {
    return USER_MESSAGE_AI_PARSE_FAILED;
  }

  if (status >= 500) {
    return "The parsing service is temporarily unavailable. Please try again in a moment or enter the details manually.";
  }

  return USER_MESSAGE_AI_PARSE_FAILED;
};

export const throwOpenAiHttpError = (status: number, bodyText: string): never => {
  logOpenAiApiError("OpenAI API error", status, bodyText);
  const message = userMessageForOpenAiHttpError(status, bodyText);
  const httpStatus = status === 429 ? 429 : 502;
  throw new AppError(message, httpStatus);
};
