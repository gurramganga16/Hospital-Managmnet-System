import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole } from '../types';
import { getJwtAccessSecret, getJwtRefreshSecret } from './config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// In-memory store for active refresh tokens to support rotation & revocation
const activeRefreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

/**
 * Hash password with SHA-256 and salt
 */
export function hashPassword(password: string, salt: string = 'hospital_salt'): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

/**
 * Generate short-lived JWT access token
 */
export function generateAccessToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, getJwtAccessSecret(), { expiresIn: '15m' });
}

/**
 * Generate refresh token with secure rotation tracking
 */
export function generateRefreshToken(user: User): string {
  const token = jwt.sign(
    { userId: user.id, jti: crypto.randomUUID() },
    getJwtRefreshSecret(),
    { expiresIn: '7d' }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  activeRefreshTokens.set(token, { userId: user.id, expiresAt });
  return token;
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtAccessSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Rotate refresh token: invalidates old token and returns new pair
 */
export function rotateRefreshToken(oldRefreshToken: string, user: User): { accessToken: string; refreshToken: string } | null {
  try {
    if (!activeRefreshTokens.has(oldRefreshToken)) {
      return null; // Token reused or revoked
    }
    jwt.verify(oldRefreshToken, getJwtRefreshSecret());
    // Invalidate old token
    activeRefreshTokens.delete(oldRefreshToken);

    // Issue new pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
  } catch {
    activeRefreshTokens.delete(oldRefreshToken);
    return null;
  }
}

/**
 * Revoke a refresh token (Logout)
 */
export function revokeRefreshToken(token: string): boolean {
  return activeRefreshTokens.delete(token);
}
