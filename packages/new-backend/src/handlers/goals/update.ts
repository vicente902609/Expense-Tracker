import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, notFound, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { updateGoalForUser } from '../../services/goals.service';

const UpdateGoalSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    targetExpense: z.number().positive().optional(),
  })
  .refine((data) => data.name !== undefined || data.targetExpense !== undefined, {
    message: 'At least one field (name or targetExpense) must be provided',
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

    const parsed = UpdateGoalSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.flatten().fieldErrors);

    const goal = await updateGoalForUser(auth.userId, parsed.data);
    if (!goal) return notFound('No goal found for this user');

    return ok(goal);
  } catch {
    return internalError();
  }
};
