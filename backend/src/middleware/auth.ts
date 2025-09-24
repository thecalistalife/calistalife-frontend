import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { verifyToken } from '@/utils/auth';
import { users } from '@/services/supabaseUser';

// Middleware to protect routes
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
      return;
    }

    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Get user from database (Supabase)
      const user = await users.findById(decoded.id);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
        return;
      }

      // Adapt to existing type shape
      req.user = { ...(user as any), _id: (user as any).id } as any;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
    return;
  }
};

// Middleware to restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
      return;
    }
    next();
  };
};

// Optional authentication middleware (for getting user info if logged in)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await users.findById(decoded.id);
        if (user) {
          req.user = { ...(user as any), _id: (user as any).id } as any;
        }
      } catch (error) {
        // Continue without user if token is invalid
      }
    }

    next();
  } catch (error) {
    next();
  }
};