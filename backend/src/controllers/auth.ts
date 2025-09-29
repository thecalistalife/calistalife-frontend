import { Request, Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '@/types';
import { generateAccessToken, generateRefreshToken, getAccessCookieOptions, getRefreshCookieOptions } from '@/utils/auth';
import crypto from 'crypto';
import { sendMail } from '@/utils/email';
import { logger } from '@/utils/logger';
import { users as SupaUsers, SupabaseUser } from '@/services/supabaseUser';

// Register user (Supabase)
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    const existing = await SupaUsers.findByEmail(email.toLowerCase());
    if (existing) {
      res.status(400).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    const user = await SupaUsers.create({ name, email, password });

    const accessToken = generateAccessToken({ _id: user.id, email: user.email, role: user.role } as any);
    const { token: refreshToken, hash, expires } = generateRefreshToken();
    await SupaUsers.setRefreshToken(user.id, hash, expires);

    res.cookie('token', accessToken, getAccessCookieOptions());
    res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());

    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, token: accessToken } });
  } catch (error) {
    next(error);
  }
};

// Login user (Supabase)
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const user = await SupaUsers.findByEmail(email.toLowerCase());
    if (!user || !(await SupaUsers.comparePassword(user, password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken({ _id: user.id, email: user.email, role: user.role } as any);
    const { token: refreshToken, hash, expires } = generateRefreshToken();
    await SupaUsers.setRefreshToken(user.id, hash, expires);

    res.cookie('token', accessToken, getAccessCookieOptions());
    res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());

    res.status(200).json({ success: true, message: 'Login successful', data: { user, token: accessToken } });
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rt = (req as any).cookies?.refresh_token as string | undefined;
    if (rt) {
      const hash = crypto.createHash('sha256').update(rt).digest('hex');
      await SupaUsers.clearRefreshTokenByHash(hash);
    }

    res.cookie('token', '', { expires: new Date(0), httpOnly: true });
    res.cookie('refresh_token', '', { expires: new Date(0), httpOnly: true });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    res.status(200).json({ success: true, message: 'User retrieved successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// Update user profile (Supabase)
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };
    const userId = (req.user as any)._id || (req.user as any).id;

    const user = await SupaUsers.update(userId, { name, email, phone } as any);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// Refresh access token using refresh token cookie (Supabase)
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rt = (req as any).cookies?.refresh_token as string | undefined;
    if (!rt) {
      res.status(401).json({ success: false, message: 'No refresh token provided' });
      return;
    }

    const hash = crypto.createHash('sha256').update(rt).digest('hex');
    const user = await SupaUsers.findByRefreshHash(hash);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const { token: newRt, hash: newHash, expires } = generateRefreshToken();
    await SupaUsers.setRefreshToken(user.id, newHash, expires);

    const access = generateAccessToken({ _id: user.id, email: user.email, role: user.role } as any);
    res.cookie('token', access, getAccessCookieOptions());
    res.cookie('refresh_token', newRt, getRefreshCookieOptions());

    res.status(200).json({ success: true, message: 'Token refreshed', data: { token: access } });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    const user = await SupaUsers.findByEmail(email.toLowerCase());
    // Always return success for privacy
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      await SupaUsers.update(user.id, { password_reset_token: resetHash as any, password_reset_expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() as any } as any);

      const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      try {
        await sendMail({ to: email, subject: 'Reset your password', html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. The link expires in 1 hour.</p>`, category: 'password-reset' });
      } catch (mailErr) {
        logger.error({ err: mailErr, email }, 'Failed to send password reset email');
        // Do not leak email failure to client; always return success for privacy
      }
    }
    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, email, newPassword } = req.body as { token: string; email: string; newPassword: string };
    if (!token || !email || !newPassword) {
      res.status(400).json({ success: false, message: 'Missing fields' });
      return;
    }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await SupaUsers.findByEmail(email.toLowerCase());
    if (!user || (user as any).password_reset_token !== hash || new Date((user as any).password_reset_expires || 0) < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    await SupaUsers.setPassword(user.id, newPassword);
    await SupaUsers.update(user.id, { password_reset_token: null as any, password_reset_expires: null as any } as any);

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// Request email verification (for logged-in user)
export const requestEmailVerification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const user = await SupaUsers.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if ((user as any).email_verified) { res.status(200).json({ success: true, message: 'Email already verified' }); return; }

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await SupaUsers.update(user.id, { email_verification_token: hash as any, email_verification_expires: new Date(Date.now() + 24*60*60*1000).toISOString() as any } as any);

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
      await sendMail({ to: user.email, subject: 'Verify your email', html: `<p>Welcome!</p><p>Click <a href=\"${verifyUrl}\">here</a> to verify your email (expires in 24 hours).</p>`, category: 'verify-email' });
    } catch (mailErr) {
      logger.error({ err: mailErr, email: user.email }, 'Failed to send verification email');
      // Still return success; user can retry
    }

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) { next(error); }
};

// Confirm email verification
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, email } = req.body as { token: string; email: string };
    if (!token || !email) { res.status(400).json({ success: false, message: 'Missing token or email' }); return; }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await SupaUsers.findByEmail(email.toLowerCase());
    if (!user || (user as any).email_verification_token !== hash || new Date((user as any).email_verification_expires || 0) < new Date()) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
      return;
    }

    await SupaUsers.update(user.id, { email_verified: true as any, email_verification_token: null as any, email_verification_expires: null as any } as any);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) { next(error); }
};

// Google login using ID token from frontend
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) { res.status(400).json({ success: false, message: 'Missing idToken' }); return; }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) { res.status(500).json({ success: false, message: 'Google client not configured' }); return; }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) { res.status(400).json({ success: false, message: 'Invalid Google token' }); return; }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const googleId = payload.sub;

    let user = await SupaUsers.findByEmail(email);
    if (!user) {
      user = await SupaUsers.create({ name, email, password: crypto.randomBytes(16).toString('hex') });
      await SupaUsers.update(user.id, { google_id: googleId as any, email_verified: true as any, avatar: (payload.picture || null) as any } as any);
    } else {
      const updates: any = {};
      if (!user.google_id) updates.google_id = googleId;
      if (!user.email_verified) updates.email_verified = true as any;
      if (Object.keys(updates).length) await SupaUsers.update(user.id, updates);
    }

    const accessToken = generateAccessToken({ _id: user.id, email: user.email, role: user.role } as any);
    const { token: refreshToken, hash, expires } = generateRefreshToken();
    await SupaUsers.setRefreshToken(user.id, hash, expires);

    res.cookie('token', accessToken, getAccessCookieOptions());
    res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());

    res.status(200).json({ success: true, message: 'Login successful', data: { user, token: accessToken } });
  } catch (error) { next(error); }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const userId = (req.user as any)._id || (req.user as any).id;

    const user = await SupaUsers.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const ok = await SupaUsers.comparePassword(user, currentPassword);
    if (!ok) { res.status(400).json({ success: false, message: 'Current password is incorrect' }); return; }

    await SupaUsers.setPassword(user.id, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

// Add address
export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const addressData = req.body as any;

    const user = await SupaUsers.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
    if (list.length === 0) addressData.isDefault = true;
    if (addressData.isDefault) list.forEach((a: any) => a.isDefault = false);
    list.push({ ...addressData, _id: crypto.randomBytes(8).toString('hex') });
    const updated = await SupaUsers.update(userId, { addresses: list as any });
    res.status(200).json({ success: true, message: 'Address added successfully', data: updated });
  } catch (error) { next(error); }
};

// Update address
export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { addressId } = req.params as any;
    const addressData = req.body as any;

    const user = await SupaUsers.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
    const idx = list.findIndex((a: any) => a._id === addressId);
    if (idx === -1) { res.status(404).json({ success: false, message: 'Address not found' }); return; }

    if (addressData.isDefault) list.forEach((a: any, i: number) => { if (i !== idx) a.isDefault = false; });
    list[idx] = { ...list[idx], ...addressData };
    const updated = await SupaUsers.update(userId, { addresses: list as any });
    res.status(200).json({ success: true, message: 'Address updated successfully', data: updated });
  } catch (error) { next(error); }
};

// Delete address
export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req.user as any)._id || (req.user as any).id;
    const { addressId } = req.params as any;

    const user = await SupaUsers.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    let list = Array.isArray(user.addresses) ? [...user.addresses] : [];
    const removed = list.find((a: any) => a._id === addressId);
    list = list.filter((a: any) => a._id !== addressId);
    if (removed?.isDefault && list.length > 0) list[0].isDefault = true;

    const updated = await SupaUsers.update(userId, { addresses: list as any });
    res.status(200).json({ success: true, message: 'Address deleted successfully', data: updated });
  } catch (error) { next(error); }
};
