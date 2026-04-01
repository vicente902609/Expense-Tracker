import jwt from 'jsonwebtoken';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const getJwtSecret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is not set');
  return s;
};

const getRefreshSecret = (): string => {
  const s = process.env.REFRESH_TOKEN_SECRET;
  if (!s) throw new Error('REFRESH_TOKEN_SECRET environment variable is not set');
  return s;
};

export interface TokenPayload {
  sub: string; // userId
}

export interface RefreshTokenPayload {
  sub: string;  // userId
  jti: string;  // tokenId
}

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: ACCESS_EXPIRES_IN });

export const signRefreshToken = (userId: string, tokenId: string): string =>
  jwt.sign({ sub: userId, jti: tokenId }, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES_IN,
  });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, getJwtSecret()) as TokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;

export const refreshTokenExpiresAt = (): number =>
  Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS;
