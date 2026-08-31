import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { User, Hospital, Prisma } from '@prisma/client';

export type UserRole = 'ADMIN' | 'HOSPITAL_ADMIN' | 'TRANSPLANT_COORDINATOR' | 'TRANSPORT_OPERATOR';

export interface AuthenticatedRequest extends Request {
  user?: User & { hospital?: Hospital | null };
}

const JWT_SECRET = process.env.JWT_SECRET || 'organlink_jwt_super_secret_key_2026_dev';

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Missing or invalid authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; id?: string };
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Invalid token payload.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { hospital: true },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, code: 'AUTH_FAILED', error: 'User account is inactive or not found.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, code: 'INVALID_TOKEN', error: 'Token verification failed or token expired.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, code: 'FORBIDDEN', error: `Role '${req.user.role}' is not permitted to perform this action.` });
      return;
    }

    next();
  };
}

export function requireVerifiedHospital(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  if (!req.user.hospital_id || !req.user.hospital) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'User is not associated with any hospital.' });
    return;
  }

  if (req.user.hospital.status !== 'VERIFIED') {
    res.status(403).json({ success: false, code: 'HOSPITAL_NOT_VERIFIED', error: `Hospital is in '${req.user.hospital.status}' status. Verification is required.` });
    return;
  }

  next();
}
