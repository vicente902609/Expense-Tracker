import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { logoutUser } from '../../services/auth.service';

const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const parsed = logoutBodySchema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    await logoutUser(auth.userId, parsed.data.refreshToken);

    return ok({ message: 'Logged out successfully' });
  } catch {
    return internalError();
  }
};
