import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { badRequest, internalError, notFound, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { deleteCategory } from '../../services/categories.service';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const categoryId = event.pathParameters?.categoryId;
    if (!categoryId) return badRequest('Missing categoryId');

    const deleted = await deleteCategory(auth.userId, categoryId);
    if (!deleted) return notFound('Category not found');

    return ok({ categoryId });
  } catch {
    return internalError();
  }
};
