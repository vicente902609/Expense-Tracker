import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { verifyAccessToken } from '../lib/jwt';
import { unauthorized } from '../lib/response';

export interface AuthContext {
  userId: string;
}

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Returns the userId on success, or an HTTP 401 response object on failure.
 */
export const requireAuth = (
  event: APIGatewayProxyEventV2,
): AuthContext | ReturnType<typeof unauthorized> => {
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return unauthorized('Missing authorization token');

  try {
    const payload = verifyAccessToken(token);
    return { userId: payload.sub };
  } catch {
    return unauthorized('Invalid or expired token');
  }
};

export const isUnauthorized = (
  result: AuthContext | ReturnType<typeof unauthorized>,
): result is ReturnType<typeof unauthorized> =>
  typeof result === 'object' && result !== null && 'statusCode' in result;
