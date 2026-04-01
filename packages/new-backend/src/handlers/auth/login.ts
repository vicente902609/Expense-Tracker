import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, ok, unauthorized } from '../../lib/response';
import { loginUser } from '../../services/auth.service';

const loginBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const parsed = loginBodySchema.safeParse(JSON.parse(event.body ?? '{}'));

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const result = await loginUser(parsed.data.email, parsed.data.password);

    if (result === 'INVALID_CREDENTIALS') {
      return unauthorized('Invalid email or password');
    }

    return ok(result);
  } catch {
    return internalError();
  }
};
