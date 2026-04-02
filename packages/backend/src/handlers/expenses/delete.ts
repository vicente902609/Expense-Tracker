import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { badRequest, internalError, notFound, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { deleteExpense } from '../../services/expenses.service';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) return badRequest('Missing expenseId');

    const deleted = await deleteExpense(auth.userId, expenseId);
    if (!deleted) return notFound('Expense not found');

    return ok({ expenseId });
  } catch {
    return internalError();
  }
};
