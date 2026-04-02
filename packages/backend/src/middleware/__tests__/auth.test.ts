import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { requireAuth, isUnauthorized } from '../auth';
import { verifyAccessToken } from '../../lib/jwt';

jest.mock('../../lib/jwt');

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

/** Build a minimal event with only the headers field populated. */
const makeEvent = (headers: Record<string, string> = {}): APIGatewayProxyEventV2 =>
  ({ headers } as unknown as APIGatewayProxyEventV2);

describe('requireAuth', () => {
  beforeEach(() => {
    mockVerifyAccessToken.mockReset();
  });

  it('returns 401 when Authorization header is absent', () => {
    const result = requireAuth(makeEvent());

    expect(result).toMatchObject({
      statusCode: 401,
      body: JSON.stringify({ success: false, message: 'Missing authorization token' }),
    });
  });

  it('returns 401 when header does not start with "Bearer "', () => {
    const result = requireAuth(makeEvent({ authorization: 'Token abc123' }));

    expect(result).toMatchObject({
      statusCode: 401,
      body: JSON.stringify({ success: false, message: 'Missing authorization token' }),
    });
  });

  it('returns 401 when header is "Bearer " with no token value', () => {
    const result = requireAuth(makeEvent({ authorization: 'Bearer ' }));

    expect(result).toMatchObject({
      statusCode: 401,
      body: JSON.stringify({ success: false, message: 'Missing authorization token' }),
    });
  });

  it('returns AuthContext with userId when token is valid (lowercase header)', () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-123' });

    const result = requireAuth(makeEvent({ authorization: 'Bearer valid.token.here' }));

    expect(result).toEqual({ userId: 'user-123' });
  });

  it('returns AuthContext with userId when token is valid (capitalized header)', () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-456' });

    const result = requireAuth(makeEvent({ Authorization: 'Bearer valid.token.here' }));

    expect(result).toEqual({ userId: 'user-456' });
  });

  it('prefers lowercase authorization header over capitalized when both are present', () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'user-lowercase' });

    const result = requireAuth(
      makeEvent({ authorization: 'Bearer lower.token', Authorization: 'Bearer upper.token' }),
    );

    expect(result).toEqual({ userId: 'user-lowercase' });
    expect(mockVerifyAccessToken).toHaveBeenCalledWith('lower.token');
  });

  it('passes the extracted token string to verifyAccessToken', () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'u1' });

    requireAuth(makeEvent({ authorization: 'Bearer my.jwt.token' }));

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('my.jwt.token');
  });

  it('returns 401 when verifyAccessToken throws (expired/invalid token)', () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const result = requireAuth(makeEvent({ authorization: 'Bearer expired.token' }));

    expect(result).toMatchObject({
      statusCode: 401,
      body: JSON.stringify({ success: false, message: 'Invalid or expired token' }),
    });
  });
});

describe('isUnauthorized', () => {
  it('returns true for a 401 response object', () => {
    const response = { statusCode: 401, headers: {}, body: '{}' };

    expect(isUnauthorized(response)).toBe(true);
  });

  it('returns false for a valid AuthContext', () => {
    expect(isUnauthorized({ userId: 'u1' })).toBe(false);
  });
});
