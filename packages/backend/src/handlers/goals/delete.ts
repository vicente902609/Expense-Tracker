import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { internalError, notFound } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { deleteGoalForUser } from '../../services/goals.service';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const deleted = await deleteGoalForUser(auth.userId);
    if (!deleted) return notFound('No goal found for this user');

    return { statusCode: 204, body: '' };
  } catch {
    return internalError();
  }
};
