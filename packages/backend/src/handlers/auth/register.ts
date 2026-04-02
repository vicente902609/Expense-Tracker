import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, conflict, created, internalError } from '../../lib/response';
import { registerUser } from '../../services/auth.service';

const registerBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const parsed = registerBodySchema.safeParse(JSON.parse(event.body ?? '{}'));

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const result = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name);

    if (result === 'EMAIL_TAKEN') {
      return conflict('An account with this email already exists');
    }

    return created(result);
  } catch {
    return internalError();
  }
};
