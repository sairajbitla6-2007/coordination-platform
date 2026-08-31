import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest, requireVerifiedHospital } from '../middleware/auth.js';
import { TransportStatus, MatchStatus, OrganStatus, RecipientStatus } from '@prisma/client';

const router = Router();

// ── GET /api/transports/:match_id ──────────────────────────────────
router.get('/:match_id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const match_id = String(req.params.match_id);

  const transport = await prisma.transport.findFirst({
    where: { match_id },
    include: {
      match: {
        include: {
          organ: { include: { hospital: true } },
          recipient: { include: { hospital: true } },
        },
      },
    },
  });

  if (!transport) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Transport tracking not found for this match.' });
    return;
  }

  res.json({ success: true, data: transport });
});

// ── PATCH /api/transports/:match_id ────────────────────────────────
router.patch('/:match_id', requireAuth, requireVerifiedHospital, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const match_id = String(req.params.match_id);
  const { status, current_temp_celsius, battery_level, gps_speed_kmh, eta_minutes } = req.body || {};

  const transport = await prisma.transport.findFirst({
    where: { match_id },
    include: { match: true },
  });

  if (!transport || !transport.match) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Transport record not found.' });
    return;
  }

  const updateData: any = {};
  if (current_temp_celsius !== undefined) updateData.current_temp_celsius = parseFloat(String(current_temp_celsius));
  if (battery_level !== undefined) updateData.battery_level = parseInt(String(battery_level));
  if (gps_speed_kmh !== undefined) updateData.gps_speed_kmh = parseFloat(String(gps_speed_kmh));
  if (eta_minutes !== undefined) updateData.eta_minutes = parseInt(String(eta_minutes));

  if (status) {
    const nextStatus = String(status).toUpperCase() as TransportStatus;
    updateData.status = nextStatus;

    if (nextStatus === TransportStatus.DISPATCHED) {
      updateData.dispatched_at = new Date();
      updateData.gps_speed_kmh = 65;
    } else if (nextStatus === TransportStatus.IN_TRANSIT) {
      updateData.in_transit_at = new Date();
      updateData.gps_speed_kmh = 80;
    } else if (nextStatus === TransportStatus.DELIVERED) {
      updateData.delivered_at = new Date();
      updateData.gps_speed_kmh = 0;
      updateData.eta_minutes = 0;

      await prisma.match.update({ where: { id: match_id }, data: { status: MatchStatus.COMPLETED } });
      await prisma.organ.update({ where: { id: transport.match.organ_id }, data: { status: OrganStatus.COMPLETED } });
      await prisma.recipient.update({ where: { id: transport.match.recipient_id }, data: { status: RecipientStatus.COMPLETED } });
    }
  }

  const updated = await prisma.transport.update({
    where: { id: transport.id },
    data: updateData,
    include: { match: true },
  });

  res.json({ success: true, data: updated, message: 'Transport telemetry updated successfully.' });
});

export default router;
