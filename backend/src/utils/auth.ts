import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import type { StringValue } from 'ms';
import { IUser } from '@/types';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

// Access Token (JWT)
export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const secret: Secret = (process.env.JWT_SECRET || 'dev_secret') as Secret;
  const expires: StringValue = (process.env.JWT_EXPIRE as StringValue) || '15m';
  return jwt.sign(payload, secret, { expiresIn: expires });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  const secret: Secret = (process.env.JWT_SECRET || 'dev_secret') as Secret;
  return jwt.verify(token, secret) as JWTPayload;
};

// Backward compatibility for existing code
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

// Refresh Token (opaque random string, hashed in DB)
export const generateRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '30', 10);
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return { token, hash, expires };
};

// Cookie options
export const getAccessCookieOptions = () => ({
  // short-lived cookie for SPA if needed; usually use Authorization header
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  expires: new Date(Date.now() + 15 * 60 * 1000)
});

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  // align with REFRESH_TOKEN_EXPIRE
  expires: new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRE || '30', 10) * 24 * 60 * 60 * 1000))
});

// Backward-compat name
export const getCookieOptions = getAccessCookieOptions;
