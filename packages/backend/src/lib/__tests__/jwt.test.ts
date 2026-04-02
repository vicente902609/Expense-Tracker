import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../jwt';

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';

beforeAll(() => {
  process.env.JWT_SECRET = ACCESS_SECRET;
  process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.REFRESH_TOKEN_SECRET;
});

describe('REFRESH_TOKEN_TTL_SECONDS', () => {
  it('equals 7 days expressed in seconds', () => {
    expect(REFRESH_TOKEN_TTL_SECONDS).toBe(7 * 24 * 60 * 60);
  });
});

describe('signAccessToken', () => {
  it('returns a three-part JWT string', () => {
    const token = signAccessToken('user-1');

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes the userId in the sub claim', () => {
    const token = signAccessToken('user-abc');
    const decoded = jwt.decode(token) as { sub: string };

    expect(decoded.sub).toBe('user-abc');
  });

  it('sets an expiry ~15 minutes from now', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signAccessToken('u1');
    const after = Math.floor(Date.now() / 1000);
    const { exp } = jwt.decode(token) as { exp: number };

    expect(exp).toBeGreaterThanOrEqual(before + 15 * 60 - 1);
    expect(exp).toBeLessThanOrEqual(after + 15 * 60 + 1);
  });

  it('throws when JWT_SECRET env var is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => signAccessToken('u1')).toThrow('JWT_SECRET environment variable is not set');
    process.env.JWT_SECRET = ACCESS_SECRET;
  });
});

describe('signRefreshToken', () => {
  it('returns a three-part JWT string', () => {
    const token = signRefreshToken('user-1', 'tid-1');

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes userId in sub and tokenId in jti', () => {
    const token = signRefreshToken('user-xyz', 'tid-999');
    const decoded = jwt.decode(token) as { sub: string; jti: string };

    expect(decoded.sub).toBe('user-xyz');
    expect(decoded.jti).toBe('tid-999');
  });

  it('sets an expiry ~7 days from now', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signRefreshToken('u1', 'tid');
    const after = Math.floor(Date.now() / 1000);
    const { exp } = jwt.decode(token) as { exp: number };

    expect(exp).toBeGreaterThanOrEqual(before + 7 * 24 * 60 * 60 - 1);
    expect(exp).toBeLessThanOrEqual(after + 7 * 24 * 60 * 60 + 1);
  });

  it('throws when REFRESH_TOKEN_SECRET env var is not set', () => {
    delete process.env.REFRESH_TOKEN_SECRET;
    expect(() => signRefreshToken('u1', 'tid')).toThrow(
      'REFRESH_TOKEN_SECRET environment variable is not set',
    );
    process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
  });
});

describe('verifyAccessToken', () => {
  it('returns payload with correct sub for a valid token', () => {
    const token = signAccessToken('user-verify');
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-verify');
  });

  it('throws when the token is signed with a wrong secret', () => {
    const badToken = jwt.sign({ sub: 'u1' }, 'wrong-secret');

    expect(() => verifyAccessToken(badToken)).toThrow();
  });

  it('throws for a malformed token string', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrow();
  });

  it('throws for an expired token', () => {
    const expired = jwt.sign({ sub: 'u1' }, ACCESS_SECRET, { expiresIn: -1 });

    expect(() => verifyAccessToken(expired)).toThrow();
  });

  it('throws when JWT_SECRET env var is not set', () => {
    const token = signAccessToken('u1');
    delete process.env.JWT_SECRET;
    expect(() => verifyAccessToken(token)).toThrow('JWT_SECRET environment variable is not set');
    process.env.JWT_SECRET = ACCESS_SECRET;
  });

  it('does not accept a refresh token as an access token', () => {
    const refreshToken = signRefreshToken('u1', 'tid');

    // Refresh tokens are signed with a different secret, so verification must fail
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

describe('verifyRefreshToken', () => {
  it('returns payload with correct sub and jti for a valid token', () => {
    const token = signRefreshToken('user-r', 'jti-r');
    const payload = verifyRefreshToken(token);

    expect(payload.sub).toBe('user-r');
    expect(payload.jti).toBe('jti-r');
  });

  it('throws when the token is signed with a wrong secret', () => {
    const badToken = jwt.sign({ sub: 'u1', jti: 'j1' }, 'wrong-secret');

    expect(() => verifyRefreshToken(badToken)).toThrow();
  });

  it('throws for a malformed token string', () => {
    expect(() => verifyRefreshToken('garbage')).toThrow();
  });

  it('throws for an expired token', () => {
    const expired = jwt.sign({ sub: 'u1', jti: 'j1' }, REFRESH_SECRET, { expiresIn: -1 });

    expect(() => verifyRefreshToken(expired)).toThrow();
  });

  it('throws when REFRESH_TOKEN_SECRET env var is not set', () => {
    const token = signRefreshToken('u1', 'j1');
    delete process.env.REFRESH_TOKEN_SECRET;
    expect(() => verifyRefreshToken(token)).toThrow(
      'REFRESH_TOKEN_SECRET environment variable is not set',
    );
    process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
  });

  it('does not accept an access token as a refresh token', () => {
    const accessToken = signAccessToken('u1');

    // Access tokens are signed with a different secret, so verification must fail
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});

describe('refreshTokenExpiresAt', () => {
  it('returns a number', () => {
    expect(typeof refreshTokenExpiresAt()).toBe('number');
  });

  it('returns a Unix timestamp approximately 7 days from now', () => {
    const before = Math.floor(Date.now() / 1000);
    const exp = refreshTokenExpiresAt();
    const after = Math.floor(Date.now() / 1000);

    expect(exp).toBeGreaterThanOrEqual(before + REFRESH_TOKEN_TTL_SECONDS);
    expect(exp).toBeLessThanOrEqual(after + REFRESH_TOKEN_TTL_SECONDS);
  });
});
