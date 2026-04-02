import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { parseExpense } from '../../services/ai.service';

const ParseExpenseSchema = z.object({
  text: z.string().trim().min(3).max(500),
  timezone: z.string().trim().min(1).default('UTC'),
  referenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'referenceDate must be YYYY-MM-DD')
    .optional(),
});

const serviceError = (err: unknown): APIGatewayProxyResultV2 => {
  const statusCode =
    err instanceof Error && typeof (err as unknown as Record<string, unknown>).statusCode === 'number'
      ? (err as Error & { statusCode: number }).statusCode
      : 500;
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: false, message: err instanceof Error ? err.message : 'Internal server error' }),
  };
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = ParseExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const result = await parseExpense(auth.userId, parsed.data);
    return ok(result);
  } catch (err) {
    const statusCode =
      err instanceof Error && typeof (err as unknown as Record<string, unknown>).statusCode === 'number'
        ? (err as Error & { statusCode: number }).statusCode
        : 0;
    if (statusCode >= 400 && statusCode < 600) return serviceError(err);
    return internalError();
  }
};
