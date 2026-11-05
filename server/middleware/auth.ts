import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'medisync_hms_secure_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user context' });
    }

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'HOSPITAL_ADMIN' ||
      allowedRoles.includes(req.user.role)
    ) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
  };
}
