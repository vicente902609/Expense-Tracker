import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { badRequest, internalError, ok } from '../../lib/response';
import { isUnauthorized, requireAuth } from '../../middleware/auth';
import { getByCategoryReport } from '../../services/reports.service';

const QuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD')
    .optional(),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    if (isUnauthorized(auth)) return auth;

    const parsed = QuerySchema.safeParse(event.queryStringParameters ?? {});
    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors);
    }

    const result = await getByCategoryReport(
      auth.userId,
      parsed.data.startDate,
      parsed.data.endDate,
    );
    return ok(result);
  } catch {
    return internalError();
  }
};
