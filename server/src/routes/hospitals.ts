import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { UserRole, HospitalStatus } from '@prisma/client';

const router = Router();

// ── POST /api/hospitals (Public Hospital Registration) ──────────────
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    hospital_name, registration_number, address, city, state, pincode,
    contact_email, contact_phone, admin_email, admin_password, admin_full_name,
    latitude, longitude
  } = req.body || {};

  if (!hospital_name || !registration_number || !contact_email || !admin_email || !admin_password || !admin_full_name) {
    res.status(422).json({ success: false, code: 'VALIDATION_ERROR', error: 'Missing required hospital or admin registration fields.' });
    return;
  }

  const existingReg = await prisma.hospital.findUnique({ where: { registration_number } });
  if (existingReg) {
    res.status(409).json({ success: false, code: 'CONFLICT', error: 'A hospital with this registration number already exists.' });
    return;
  }

  const existingEmail = await prisma.hospital.findUnique({ where: { contact_email } });
  if (existingEmail) {
    res.status(409).json({ success: false, code: 'CONFLICT', error: 'A hospital with this contact email already exists.' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: String(admin_email).toLowerCase().trim() } });
  if (existingUser) {
    res.status(409).json({ success: false, code: 'CONFLICT', error: 'An account with this admin email already exists.' });
    return;
  }

  const adminPasswordHash = await bcrypt.hash(String(admin_password), 10);

  const result = await prisma.$transaction(async (tx) => {
    const hospital = await tx.hospital.create({
      data: {
        name: String(hospital_name),
        registration_number: String(registration_number),
        address: address ? String(address) : null,
        city: city ? String(city) : null,
        state: state ? String(state) : null,
        pincode: pincode ? String(pincode) : null,
        contact_email: String(contact_email),
        contact_phone: contact_phone ? String(contact_phone) : null,
        latitude: latitude ? parseFloat(String(latitude)) : null,
        longitude: longitude ? parseFloat(String(longitude)) : null,
        status: HospitalStatus.PENDING,
      },
    });

    const user = await tx.user.create({
      data: {
        email: String(admin_email).toLowerCase().trim(),
        password_hash: adminPasswordHash,
        full_name: String(admin_full_name),
        role: UserRole.HOSPITAL_ADMIN,
        hospital_id: hospital.id,
      },
    });

    await tx.notification.create({
      data: {
        hospital_id: hospital.id,
        title: 'New Hospital Registration Pending',
        message: `${hospital.name} has submitted an application for NOTTO accreditation.`,
        notification_type: 'REGISTRATION_STATUS',
        action_url: '/admin/queue',
      },
    });

    return { hospital, user };
  });

  const { password_hash, reset_token, ...safeUser } = result.user;

  res.status(201).json({
    success: true,
    data: {
      hospital: result.hospital,
      admin_user: safeUser,
    },
    message: 'Hospital registered successfully. Your application is pending admin review.',
  });
});

// ── GET /api/hospitals ───────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', error: 'Authentication required.' });
    return;
  }

  if (req.user.role === UserRole.ADMIN) {
    const statusParam = req.query.status as string;
    const whereClause: any = {};
    if (statusParam && ['PENDING', 'VERIFIED', 'REJECTED'].includes(statusParam.toUpperCase())) {
      whereClause.status = statusParam.toUpperCase() as HospitalStatus;
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: hospitals });
    return;
  }

  if (!req.user.hospital_id) {
    res.json({ success: true, data: [] });
    return;
  }

  const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospital_id } });
  res.json({ success: true, data: hospital ? [hospital] : [] });
});

// ── GET /api/hospitals/:id ───────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);

  if (req.user?.role !== UserRole.ADMIN && req.user?.hospital_id !== id) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You can only view your own hospital.' });
    return;
  }

  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
    return;
  }

  res.json({ success: true, data: hospital });
});

// ── PATCH /api/hospitals/:id/approve (ADMIN Only) ───────────────────
router.patch('/:id/approve', requireAuth, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const hospital = await prisma.hospital.findUnique({ where: { id } });

  if (!hospital) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
    return;
  }

  if (hospital.status !== HospitalStatus.PENDING) {
    res.status(409).json({ success: false, code: 'INVALID_TRANSITION', error: `Cannot approve hospital in '${hospital.status}' state.` });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const h = await tx.hospital.update({
      where: { id },
      data: { status: HospitalStatus.VERIFIED },
    });

    await tx.notification.create({
      data: {
        hospital_id: id,
        title: 'Hospital Accreditation Approved',
        message: `Congratulations! ${h.name} has been verified and granted full national transplant network access.`,
        notification_type: 'HOSPITAL_APPROVED',
        action_url: '/dashboard',
      },
    });

    await tx.auditLog.create({
      data: {
        actor_id: req.user?.id || null,
        actor_email: req.user?.email || null,
        action: 'APPROVE_HOSPITAL',
        resource_type: 'Hospital',
        resource_id: id,
        details: { hospital_name: h.name },
      },
    });

    return h;
  });

  res.json({ success: true, data: updated, message: `Hospital '${updated.name}' has been approved.` });
});

// ── PATCH /api/hospitals/:id/reject (ADMIN Only) ────────────────────
router.patch('/:id/reject', requireAuth, requireRole(UserRole.ADMIN), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { reason } = req.body || {};

  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', error: 'Hospital not found.' });
    return;
  }

  if (hospital.status !== HospitalStatus.PENDING) {
    res.status(409).json({ success: false, code: 'INVALID_TRANSITION', error: `Cannot reject hospital in '${hospital.status}' state.` });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const h = await tx.hospital.update({
      where: { id },
      data: {
        status: HospitalStatus.REJECTED,
        rejection_reason: reason ? String(reason) : 'Failed accreditation check.',
      },
    });

    await tx.notification.create({
      data: {
        hospital_id: id,
        title: 'Hospital Registration Not Approved',
        message: `Your registration was rejected. Reason: ${h.rejection_reason}`,
        notification_type: 'HOSPITAL_REJECTED',
        action_url: '/rejected',
      },
    });

    return h;
  });

  res.json({ success: true, data: updated, message: `Hospital '${updated.name}' has been rejected.` });
});

export default router;
