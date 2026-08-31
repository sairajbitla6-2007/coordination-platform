import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest, requireVerifiedHospital } from '../middleware/auth.js';
import { OrganType, BloodGroup, OrganStatus } from '@prisma/client';

const router = Router();

// ── POST /api/organs (Create Donor Organ) ─────────────────────────
router.post('/', requireAuth, requireVerifiedHospital, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    organ_type, blood_group, hla_typing, cold_ischemia_hours,
    donor_age, donor_gender, notes, cause_of_death, donor_ref
  } = req.body || {};

  if (!organ_type || !blood_group) {
    res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing organ_type or blood_group.' });
    return;
  }

  const hospitalId = req.user?.hospital_id;
  if (!hospitalId && req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Admin must specify hospital_id.' });
    return;
  }

  const targetHospitalId = hospitalId || String(req.body.hospital_id);
  const hours = cold_ischemia_hours ? parseInt(String(cold_ischemia_hours)) : 12;
  const deadline = new Date(Date.now() + hours * 3600 * 1000);
  const refNumber = donor_ref ? String(donor_ref) : `L-DONOR-${Math.floor(100 + Math.random() * 900)}`;

  const organ = await prisma.organ.create({
    data: {
      hospital_id: targetHospitalId,
      donor_ref: refNumber,
      organ_type: String(organ_type).toUpperCase() as OrganType,
      blood_group: String(blood_group).toUpperCase() as BloodGroup,
      hla_typing: hla_typing || null,
      cold_ischemia_hours: hours,
      donor_age: donor_age ? parseInt(String(donor_age)) : null,
      donor_gender: donor_gender ? String(donor_gender) : null,
      notes: notes ? String(notes) : null,
      cause_of_death: cause_of_death ? String(cause_of_death) : null,
      viability_deadline: deadline,
      status: 'AVAILABLE' as OrganStatus,
    },
    include: { hospital: true },
  });

  res.status(201).json({ success: true, data: organ, message: 'Donor organ listing created successfully.' });
});

// ── GET /api/organs ───────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, organ_type, available_only } = req.query;

  const whereClause: any = {};

  if (req.user?.role !== 'ADMIN') {
    whereClause.hospital_id = req.user?.hospital_id || undefined;
  }

  if (available_only === 'true') {
    whereClause.status = 'AVAILABLE' as OrganStatus;
    whereClause.viability_deadline = { gt: new Date() };
  } else if (status) {
    whereClause.status = String(status).toUpperCase() as OrganStatus;
  }

  if (organ_type) {
    whereClause.organ_type = String(organ_type).toUpperCase() as OrganType;
  }

  const organs = await prisma.organ.findMany({
    where: whereClause,
    include: { hospital: true },
    orderBy: { created_at: 'desc' },
  });

  res.json({ success: true, data: organs });
});

// ── GET /api/organs/available ─────────────────────────────────────
router.get('/available', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const organs = await prisma.organ.findMany({
    where: {
      status: 'AVAILABLE' as OrganStatus,
      viability_deadline: { gt: new Date() },
    },
    include: { hospital: true },
    orderBy: { created_at: 'desc' },
  });

  res.json({ success: true, data: organs });
});

// ── GET /api/organs/:id ───────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const organ = await prisma.organ.findUnique({
    where: { id },
    include: { hospital: true },
  });

  if (!organ) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ not found.' });
    return;
  }

  if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== organ.hospital_id) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital organs.' });
    return;
  }

  res.json({ success: true, data: organ });
});

// ── PATCH /api/organs/:id ─────────────────────────────────────────
router.patch('/:id', requireAuth, requireVerifiedHospital, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { notes, status } = req.body || {};

  const organ = await prisma.organ.findUnique({ where: { id } });
  if (!organ) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Organ not found.' });
    return;
  }

  if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== organ.hospital_id) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You do not own this organ listing.' });
    return;
  }

  const updateData: any = {};
  if (notes !== undefined) updateData.notes = String(notes);
  if (status !== undefined) updateData.status = String(status).toUpperCase() as OrganStatus;

  const updated = await prisma.organ.update({
    where: { id },
    data: updateData,
    include: { hospital: true },
  });

  res.json({ success: true, data: updated, message: 'Organ updated successfully.' });
});

export default router;
