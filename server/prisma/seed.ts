import { PrismaClient, HospitalStatus, UserRole, OrganType, BloodGroup, UrgencyLevel, OrganStatus, RecipientStatus, MatchStatus, TransportStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Node.js / Prisma Database Seeding...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminDemo@2024', 10);
  const metroPasswordHash = await bcrypt.hash('MetroDemo@2024', 10);
  const stjudePasswordHash = await bcrypt.hash('StJudeDemo@2024', 10);
  const apolloPasswordHash = await bcrypt.hash('ApolloDemo@2024', 10);
  const citymedPasswordHash = await bcrypt.hash('CityMedDemo@2024', 10);
  const hopePasswordHash = await bcrypt.hash('HopeDemo@2024', 10);
  const sunrisePasswordHash = await bcrypt.hash('SunriseDemo@2024', 10);

  // 1. Seed Hospitals
  const metroGen = await prisma.hospital.create({
    data: {
      id: '11111111-0001-0001-0001-000000000001',
      name: 'Metro General Hospital & Trauma Center',
      registration_number: 'NOTTO-KA-2024-8841',
      address: '14/2 Victoria Road, Central District',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      contact_email: 'priya.sharma@metrogeneral.med.in',
      contact_phone: '+91 98450 12345',
      status: HospitalStatus.VERIFIED,
    },
  });

  const stJude = await prisma.hospital.create({
    data: {
      id: '11111111-0002-0002-0002-000000000002',
      name: 'St. Jude Heart & Lung Institute',
      registration_number: 'NOTTO-TN-2023-5592',
      address: '88 Poonamallee High Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600010',
      latitude: 13.0827,
      longitude: 80.2707,
      contact_email: 'rajiv.menon@stjudeheart.org',
      contact_phone: '+91 98401 98765',
      status: HospitalStatus.VERIFIED,
    },
  });

  const apolloCare = await prisma.hospital.create({
    data: {
      id: '11111111-0003-0003-0003-000000000003',
      name: 'Apollo Multi-Specialty Hospital',
      registration_number: 'NOTTO-KA-2024-9104',
      address: '154/11 Bannerghatta Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
      latitude: 12.8988,
      longitude: 77.5996,
      contact_email: 'ananya.ray@apollo.org',
      contact_phone: '+91 97412 34567',
      status: HospitalStatus.VERIFIED,
    },
  });

  const cityMed = await prisma.hospital.create({
    data: {
      id: '11111111-0004-0004-0004-000000000004',
      name: 'City Medical University Hospital',
      registration_number: 'NOTTO-TG-2023-1092',
      address: '5-9-22 Secretariate Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500063',
      latitude: 17.385,
      longitude: 78.4867,
      contact_email: 'coordinator@citymeduniv.ac.in',
      contact_phone: '+91 94400 11223',
      status: HospitalStatus.VERIFIED,
    },
  });

  const hopeCenter = await prisma.hospital.create({
    data: {
      id: '11111111-0005-0005-0005-000000000005',
      name: 'Hope Regional Specialty Hospital',
      registration_number: 'NOTTO-KA-2024-APPL-441',
      address: '42 Outer Ring Road, Marathahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560037',
      latitude: 12.9569,
      longitude: 77.7011,
      contact_email: 's.kulkarni@hopespecialty.com',
      contact_phone: '+91 99012 33445',
      status: HospitalStatus.PENDING,
    },
  });

  const sunriseClinic = await prisma.hospital.create({
    data: {
      id: '11111111-0006-0006-0006-000000000006',
      name: 'Sunrise Community Healthcare Clinic',
      registration_number: 'NOTTO-KA-2024-APPL-019',
      address: '71 KRS Road, Metagalli',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570016',
      latitude: 12.3375,
      longitude: 76.6219,
      contact_email: 'rkjoshi@sunrisehealth.org',
      contact_phone: '+91 98440 55667',
      status: HospitalStatus.REJECTED,
      rejection_reason: 'Hospital lacks dedicated ICU beds and NABH accreditation certificate was unverified.',
    },
  });

  // 2. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@organlink.demo',
      password_hash: adminPasswordHash,
      full_name: 'Platform Admin (NOTTO Desk)',
      role: UserRole.ADMIN,
      hospital_id: null,
      preferences: { urgent_alerts: true, sound_alerts: true, digest: true },
    },
  });

  const metroAdmin = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'priya.sharma@metrogeneral.med.in',
      password_hash: metroPasswordHash,
      full_name: 'Dr. Priya Sharma',
      role: UserRole.HOSPITAL_ADMIN,
      hospital_id: metroGen.id,
    },
  });

  const stjudeAdmin = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'rajiv.menon@stjudeheart.org',
      password_hash: stjudePasswordHash,
      full_name: 'Dr. Rajiv Menon',
      role: UserRole.HOSPITAL_ADMIN,
      hospital_id: stJude.id,
    },
  });

  const apolloAdmin = await prisma.user.create({
    data: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'ananya.ray@apollo.org',
      password_hash: apolloPasswordHash,
      full_name: 'Dr. Ananya Ray',
      role: UserRole.HOSPITAL_ADMIN,
      hospital_id: apolloCare.id,
    },
  });

  // 3. Seed Donor Organs
  const organHeart = await prisma.organ.create({
    data: {
      id: '22222222-0001-0001-0001-000000000001',
      hospital_id: metroGen.id,
      donor_ref: 'L-DONOR-881',
      organ_type: OrganType.HEART,
      blood_group: BloodGroup.A_POSITIVE,
      hla_typing: { a: ['A*02', 'A*24'], b: ['B*35', 'B*44'], dr: ['DRB1*04', 'DRB1*07'] },
      cold_ischemia_hours: 4,
      donor_age: 34,
      donor_gender: 'MALE',
      notes: 'Donor brain dead post RTA. Cardiac output excellent, echo EF 65%.',
      cause_of_death: 'Road Traffic Accident (Severe Traumatic Brain Injury)',
      viability_deadline: new Date(Date.now() + 3.5 * 3600 * 1000),
      status: OrganStatus.AVAILABLE,
    },
  });

  const organKidney = await prisma.organ.create({
    data: {
      id: '22222222-0002-0002-0002-000000000002',
      hospital_id: metroGen.id,
      donor_ref: 'L-DONOR-882',
      organ_type: OrganType.KIDNEY,
      blood_group: BloodGroup.O_POSITIVE,
      hla_typing: { a: ['A*01', 'A*03'], b: ['B*07', 'B*08'], dr: ['DRB1*03', 'DRB1*15'] },
      cold_ischemia_hours: 24,
      donor_age: 42,
      donor_gender: 'FEMALE',
      notes: 'Right kidney, zero warm ischemia time. Normal renal function.',
      cause_of_death: 'Intracerebral Hemorrhage',
      viability_deadline: new Date(Date.now() + 18 * 3600 * 1000),
      status: OrganStatus.AVAILABLE,
    },
  });

  // 4. Seed Recipients
  const recipientHeart = await prisma.recipient.create({
    data: {
      id: '33333333-0001-0001-0001-000000000001',
      hospital_id: stJude.id,
      patient_ref: 'PT-STJ-9941',
      organ_needed: OrganType.HEART,
      blood_group: BloodGroup.A_POSITIVE,
      hla_typing: { a: ['A*02', 'A*11'], b: ['B*35', 'B*51'], dr: ['DRB1*04', 'DRB1*11'] },
      urgency_level: UrgencyLevel.CRITICAL,
      age: 48,
      gender: 'MALE',
      ward: 'ICU-B3',
      registered_at: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      status: RecipientStatus.ACTIVE,
    },
  });

  const recipientKidney = await prisma.recipient.create({
    data: {
      id: '33333333-0002-0002-0002-000000000002',
      hospital_id: apolloCare.id,
      patient_ref: 'PT-APL-4012',
      organ_needed: OrganType.KIDNEY,
      blood_group: BloodGroup.O_POSITIVE,
      hla_typing: { a: ['A*01', 'A*02'], b: ['B*07', 'B*40'], dr: ['DRB1*03', 'DRB1*04'] },
      urgency_level: UrgencyLevel.HIGH,
      age: 56,
      gender: 'FEMALE',
      ward: 'Nephrology Ward 4',
      registered_at: new Date(Date.now() - 120 * 24 * 3600 * 1000),
      status: RecipientStatus.ACTIVE,
    },
  });

  // 5. Seed Confirmed Match & Active Transport
  const confirmedMatch = await prisma.match.create({
    data: {
      id: '44444444-0001-0001-0001-000000000001',
      organ_id: organHeart.id,
      recipient_id: recipientHeart.id,
      composite_score: 97.4,
      distance_km: 310.5,
      transit_time_minutes: 55,
      score_breakdown: { blood: 100, hla: 95, distance: 90, urgency: 100, viability_feasible: true, composite: 97.4 },
      status: MatchStatus.CONFIRMED,
      proposed_at: new Date(Date.now() - 2 * 3600 * 1000),
      respond_by: new Date(Date.now() - 1.25 * 3600 * 1000),
      responded_at: new Date(Date.now() - 1.5 * 3600 * 1000),
    },
  });

  const transport = await prisma.transport.create({
    data: {
      id: '55555555-0001-0001-0001-000000000001',
      match_id: confirmedMatch.id,
      status: TransportStatus.IN_TRANSIT,
      preservation_box_id: 'LIFELINK-BOX-882',
      current_temp_celsius: 3.8,
      battery_level: 92,
      gps_speed_kmh: 78,
      eta_minutes: 22,
      dispatched_at: new Date(Date.now() - 1 * 3600 * 1000),
      in_transit_at: new Date(Date.now() - 0.5 * 3600 * 1000),
      vehicle_type: 'GREEN_CORRIDOR_AMBULANCE',
      tracking_number: 'LL-TRK-2026-8841',
      driver_name: 'Captain Rajesh V. (Logistics)',
      driver_phone: '+91 99887 66554',
      checkpoints: [
        { title: 'Organ Retrieval & Cross-Clamp Sign-off', completed: true, location: 'Metro General Surgical Suite' },
        { title: 'Cold Preservation Box Sealed & QA Verified', completed: true, location: 'Ambulance Departure Bay' },
        { title: 'Green Corridor Tollway Transit', completed: true, location: 'Expressway Air/Ground Route' },
        { title: 'Recipient OT Handoff & Surgery Prep', completed: false, location: 'St. Jude Heart & Lung Institute' },
      ],
    },
  });

  // 6. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        hospital_id: hopeCenter.id,
        title: 'New Hospital Registration Submitted',
        message: 'Hope Regional Specialty Hospital has submitted an application for NOTTO accreditation.',
        notification_type: 'REGISTRATION_STATUS',
        action_url: '/admin/queue',
      },
      {
        hospital_id: stJude.id,
        title: 'URGENT: Incoming Match Proposal - Heart (A+)',
        message: 'Metro General Hospital proposed Heart for Patient PT-STJ-9941.',
        notification_type: 'PROPOSAL_RECEIVED',
        is_read: false,
        action_url: '/requests',
      },
    ],
  });

  console.log('✅ PostgreSQL Database Seeding Complete!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
