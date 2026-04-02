import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { internalError, notFound, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { getGoalForUser } from '../../services/goals.service';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const goal = await getGoalForUser(auth.userId);
    if (!goal) return notFound('No goal found for this user');

    return ok(goal);
  } catch {
    return internalError();
  }
};
