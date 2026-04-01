import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, notFound, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { updateExpense } from '../../services/expenses.service';

const UpdateExpenseSchema = z
  .object({
    amount: z.number().positive().optional(),
    description: z.string().max(500).optional(),
    categoryId: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) return badRequest('Missing expenseId');

    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = UpdateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const expense = await updateExpense(auth.userId, expenseId, parsed.data);
    if (!expense) return notFound('Expense not found');

    return ok(expense);
  } catch {
    return internalError();
  }
};
