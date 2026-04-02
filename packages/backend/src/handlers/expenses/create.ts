import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, created, internalError } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { createExpense } from '../../services/expenses.service';

const CreateExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

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

    const parsed = CreateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const expense = await createExpense(auth.userId, parsed.data);
    return created(expense);
  } catch {
    return internalError();
  }
};
