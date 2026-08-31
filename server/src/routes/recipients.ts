import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest, requireVerifiedHospital } from '../middleware/auth.js';
type OrganType = 'KIDNEY' | 'LIVER' | 'HEART' | 'LUNG' | 'PANCREAS' | 'INTESTINE' | 'CORNEA';
type BloodGroup = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';
type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type RecipientStatus = 'ACTIVE' | 'MATCHED' | 'COMPLETED' | 'WITHDRAWN';

const router = Router();

// ── POST /api/recipients (Create Recipient Listing) ───────────────
router.post('/', requireAuth, requireVerifiedHospital, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    organ_needed, blood_group, hla_typing, urgency_level, patient_ref,
    age, gender, ward
  } = req.body || {};

  if (!organ_needed || !blood_group) {
    res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing organ_needed or blood_group.' });
    return;
  }

  const hospitalId = req.user?.hospital_id;
  if (!hospitalId && req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Admin must specify hospital_id.' });
    return;
  }

  const targetHospitalId = hospitalId || String(req.body.hospital_id);
  const refNumber = patient_ref ? String(patient_ref) : `PT-${Math.floor(1000 + Math.random() * 9000)}`;

  const recipient = await prisma.recipient.create({
    data: {
      hospital_id: targetHospitalId,
      patient_ref: refNumber,
      organ_needed: String(organ_needed).toUpperCase() as OrganType,
      blood_group: String(blood_group).toUpperCase() as BloodGroup,
      hla_typing: hla_typing || null,
      urgency_level: (urgency_level ? String(urgency_level) : 'MEDIUM').toUpperCase() as UrgencyLevel,
      age: age ? parseInt(String(age)) : null,
      gender: gender ? String(gender) : null,
      ward: ward ? String(ward) : null,
      registered_at: new Date(),
      status: 'ACTIVE' as RecipientStatus,
    },
    include: { hospital: true },
  });

  res.status(201).json({ success: true, data: recipient, message: 'Recipient registered on national waiting list.' });
});

// ── GET /api/recipients ───────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { urgency_level, organ_needed, status, hospital_id } = req.query;

  const whereClause: any = {};

  if (hospital_id) {
    whereClause.hospital_id = String(hospital_id);
  }

  if (status) {
    whereClause.status = String(status).toUpperCase() as RecipientStatus;
  } else {
    whereClause.status = 'ACTIVE' as RecipientStatus;
  }

  if (urgency_level) {
    whereClause.urgency_level = String(urgency_level).toUpperCase() as UrgencyLevel;
  }

  if (organ_needed) {
    whereClause.organ_needed = String(organ_needed).toUpperCase() as OrganType;
  }

  const recipients = await prisma.recipient.findMany({
    where: whereClause,
    include: { hospital: true },
    orderBy: { registered_at: 'asc' },
  });

  res.json({ success: true, data: recipients });
});

// ── GET /api/recipients/:id ───────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const recipient = await prisma.recipient.findUnique({
    where: { id },
    include: { hospital: true },
  });

  if (!recipient) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Recipient not found.' });
    return;
  }

  if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== recipient.hospital_id) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital recipients.' });
    return;
  }

  res.json({ success: true, data: recipient });
});

// ── PATCH /api/recipients/:id ─────────────────────────────────────
router.patch('/:id', requireAuth, requireVerifiedHospital, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { urgency_level, status } = req.body || {};

  const recipient = await prisma.recipient.findUnique({ where: { id } });
  if (!recipient) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Recipient not found.' });
    return;
  }

  if (req.user?.role !== 'ADMIN' && req.user?.hospital_id !== recipient.hospital_id) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You do not own this recipient entry.' });
    return;
  }

  const updateData: any = {};
  if (urgency_level !== undefined) updateData.urgency_level = String(urgency_level).toUpperCase() as UrgencyLevel;
  if (status !== undefined) updateData.status = String(status).toUpperCase() as RecipientStatus;

  const updated = await prisma.recipient.update({
    where: { id },
    data: updateData,
    include: { hospital: true },
  });

  res.json({ success: true, data: updated, message: 'Recipient updated successfully.' });
});

export default router;
