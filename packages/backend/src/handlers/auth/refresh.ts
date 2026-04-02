import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, ok, unauthorized } from '../../lib/response';
import { refreshTokens } from '../../services/auth.service';

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const parsed = refreshBodySchema.safeParse(JSON.parse(event.body ?? '{}'));

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const result = await refreshTokens(parsed.data.refreshToken);

    if (result === 'INVALID_TOKEN') {
      return unauthorized('Invalid or expired refresh token');
    }

    return ok(result);
  } catch {
    return internalError();
  }
};
