import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, conflict, created, internalError } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { createGoalForUser } from '../../services/goals.service';

const CreateGoalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetExpense: z.number().positive(),
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = CreateGoalSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

    const result = await createGoalForUser(auth.userId, parsed.data);
    if (result.alreadyExists) {
      return conflict('A goal already exists for this user. Use PUT /goals to update it.');
    }

    return created(result.goal);
  } catch {
    return internalError();
  }
};
