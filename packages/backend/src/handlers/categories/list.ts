import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { internalError, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { listCategories } from '../../services/categories.service';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const categories = await listCategories(auth.userId);

    return ok(categories);
  } catch {
    return internalError();
  }
};
