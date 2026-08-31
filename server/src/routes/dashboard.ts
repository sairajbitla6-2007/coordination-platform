import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { UserRole, OrganStatus, RecipientStatus, MatchStatus, TransportStatus } from '@prisma/client';

const router = Router();

// ── GET /api/dashboard/stats ───────────────────────────────────────
router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const isGlobal = req.user?.role === UserRole.ADMIN;
  const hospitalId = req.user?.hospital_id;

  const organWhere: any = isGlobal ? {} : { hospital_id: hospitalId };
  const recipientWhere: any = isGlobal ? {} : { hospital_id: hospitalId };

  const [
    activeDonors,
    activeRecipients,
    inTransitTransports,
    completedTransplants,
    totalHospitals,
    pendingHospitals,
  ] = await Promise.all([
    prisma.organ.count({ where: { ...organWhere, status: OrganStatus.AVAILABLE, viability_deadline: { gt: new Date() } } }),
    prisma.recipient.count({ where: { ...recipientWhere, status: RecipientStatus.ACTIVE } }),
    prisma.transport.count({ where: { status: { in: [TransportStatus.DISPATCHED, TransportStatus.IN_TRANSIT] } } }),
    prisma.match.count({ where: { status: MatchStatus.COMPLETED } }),
    prisma.hospital.count(),
    prisma.hospital.count({ where: { status: 'PENDING' } }),
  ]);

  res.json({
    success: true,
    data: {
      active_donors: activeDonors,
      active_recipients: activeRecipients,
      in_transit_transports: inTransitTransports,
      completed_transplants: completedTransplants,
      total_hospitals: totalHospitals,
      pending_hospitals: pendingHospitals,
    },
  });
});

// ── GET /api/audit-logs (ADMIN Only) ───────────────────────────────
router.get('/audit-logs', requireAuth, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  res.json({ success: true, data: auditLogs });
});

export default router;
