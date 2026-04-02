import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, created, internalError } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { createCategory } from '../../services/categories.service';

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a 6-digit hex, e.g. #ff5733'),
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

    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const category = await createCategory(auth.userId, parsed.data);
    return created(category);
  } catch {
    return internalError();
  }
};
