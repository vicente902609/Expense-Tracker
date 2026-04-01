import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessTokenPayload = { sub: string };
export type RefreshTokenPayload = { sub: string; jti: string };

export const signAccessToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

export const signRefreshToken = (userId: string, tokenId: string): string =>
  jwt.sign({ sub: userId, jti: tokenId }, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;

export const refreshTokenExpiresAt = (): Date => new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
