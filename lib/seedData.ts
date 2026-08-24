import { Hospital, Listing, Match, NotificationItem, Transport } from './types';

export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-metro-gen',
    name: 'Metro General Hospital & Trauma Center',
    licenseNumber: 'NOTTO-KA-2024-8841',
    hospitalType: 'TRANSPLANT_CENTER',
    address: '14/2 Victoria Road, Central District',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    adminContact: {
      name: 'Dr. Priya Sharma, MS, MCh',
      email: 'priya.sharma@metrogeneral.med.in',
      phone: '+91 98450 12345',
      designation: 'Chief Transplant Coordinator'
    },
    documents: [
      {
        id: 'doc-1',
        name: 'NOTTO_Transplant_License_2024_2029.pdf',
        type: 'application/pdf',
        size: '2.4 MB',
        uploadedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'doc-2',
        name: 'NABH_Accreditation_Certificate.pdf',
        type: 'application/pdf',
        size: '1.8 MB',
        uploadedAt: '2024-01-15T10:32:00Z'
      }
    ],
    status: 'VERIFIED',
    verifiedAt: '2024-01-18T14:20:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: 'hosp-st-jude',
    name: 'St. Jude Heart & Lung Institute',
    licenseNumber: 'NOTTO-TN-2023-5592',
    hospitalType: 'TRANSPLANT_CENTER',
    address: '88 Poonamallee High Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600010',
    adminContact: {
      name: 'Dr. Rajiv Menon, FRCS',
      email: 'rajiv.menon@stjudeheart.org',
      phone: '+91 98401 98765',
      designation: 'Director of Thoracic Transplantation'
    },
    documents: [
      {
        id: 'doc-3',
        name: 'Thoracic_Organ_Retrieval_Permit.pdf',
        type: 'application/pdf',
        size: '3.1 MB',
        uploadedAt: '2023-11-10T09:15:00Z'
      }
    ],
    status: 'VERIFIED',
    verifiedAt: '2023-11-12T11:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: 'hosp-apollo-care',
    name: 'Apollo Multi-Specialty Hospital',
    licenseNumber: 'NOTTO-KA-2024-9104',
    hospitalType: 'TRANSPLANT_CENTER',
    address: '154/11 Bannerghatta Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560076',
    adminContact: {
      name: 'Dr. Ananya Ray',
      email: 'ananya.ray@apollo.org',
      phone: '+91 97412 34567',
      designation: 'Renal Transplant Lead'
    },
    documents: [
      {
        id: 'doc-4',
        name: 'MultiOrgan_License.pdf',
        type: 'application/pdf',
        size: '2.9 MB',
        uploadedAt: '2024-02-01T08:45:00Z'
      }
    ],
    status: 'VERIFIED',
    verifiedAt: '2024-02-03T16:10:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813593-39f50f447a7b?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: 'hosp-city-med',
    name: 'City Medical University Hospital',
    licenseNumber: 'NOTTO-TS-2024-1188',
    hospitalType: 'GOVERNMENT_MEDICAL_COLLEGE',
    address: 'Osmania Medical Campus, Koti',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500095',
    adminContact: {
      name: 'Dr. Vikram Reddy',
      email: 'coordinator@citymeduniv.ac.in',
      phone: '+91 94400 55667',
      designation: 'Nodal Officer - Jeevandan'
    },
    documents: [
      {
        id: 'doc-5',
        name: 'Govt_University_Registration.pdf',
        type: 'application/pdf',
        size: '4.2 MB',
        uploadedAt: '2024-03-01T12:00:00Z'
      }
    ],
    status: 'VERIFIED',
    verifiedAt: '2024-03-05T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=256'
  },
  {
    id: 'hosp-hope-center',
    name: 'Hope Regional Specialty Hospital',
    licenseNumber: 'NOTTO-APPL-2026-0922',
    hospitalType: 'SPECIALTY_HOSPITAL',
    address: '42 Ring Road, HSR Layout Sector 2',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
    adminContact: {
      name: 'Dr. Sunil Kulkarni',
      email: 's.kulkarni@hopespecialty.com',
      phone: '+91 98860 77889',
      designation: 'Medical Superintendent'
    },
    documents: [
      {
        id: 'doc-6',
        name: 'Hospital_Registration_Form_Signed.pdf',
        type: 'application/pdf',
        size: '1.9 MB',
        uploadedAt: '2026-08-20T14:30:00Z'
      },
      {
        id: 'doc-7',
        name: 'OT_Infrastructure_Audit_Report.pdf',
        type: 'application/pdf',
        size: '5.6 MB',
        uploadedAt: '2026-08-20T14:32:00Z'
      }
    ],
    status: 'PENDING_REVIEW'
  },
  {
    id: 'hosp-sunrise-clinic',
    name: 'Sunrise Community Healthcare Clinic',
    licenseNumber: 'NOTTO-APPL-2026-0104',
    hospitalType: 'RECOVERY_CENTER',
    address: '109 Station Road',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    adminContact: {
      name: 'Dr. R. K. Joshi',
      email: 'rkjoshi@sunrisehealth.org',
      phone: '+91 99001 22334',
      designation: 'Administrator'
    },
    documents: [
      {
        id: 'doc-8',
        name: 'Clinic_Permit_2023.pdf',
        type: 'application/pdf',
        size: '1.2 MB',
        uploadedAt: '2026-08-15T09:00:00Z'
      }
    ],
    status: 'REJECTED',
    rejectionReason: 'Inadequate modular OT facility for cold preservation retrieval. Facility is not certified as a Level-1 organ recovery or surgical transplant center under NOTTO guidelines.'
  }
];

// Reference timestamps relative to runtime
const now = Date.now();
const hour = 3600 * 1000;
const day = 24 * hour;

export const SEED_LISTINGS: Listing[] = [
  // 1. ACTIVE Donor Heart (Metro Gen) with high urgency deadline (45 mins left)
  {
    id: 'L-DONOR-882',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Heart',
    bloodType: 'O+',
    hlaTyping: {
      a: ['A*02', 'A*24'],
      b: ['B*35', 'B*44'],
      dr: ['DRB1*04', 'DRB1*07'],
      dq: ['DQB1*03', 'DQB1*02']
    },
    status: 'ACTIVE',
    createdAt: new Date(now - 3.25 * hour).toISOString(),
    donorAge: 29,
    donorGender: 'MALE',
    viabilityDeadline: new Date(now + 45 * 60 * 1000).toISOString(), // 45m left
    initialViabilityHours: 4,
    coldIschemiaMaxHours: 4,
    conditionNotes: 'Brain dead donor (RTA). LVEF 60%, normal coronary angiography, no inotropic support requirement.',
    donorCauseOfDeath: 'Severe Traumatic Brain Injury'
  },

  // 2. ACTIVE Donor Kidney (Metro Gen) with ample viability (18 hours left)
  {
    id: 'L-DONOR-449',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Kidney',
    bloodType: 'A+',
    hlaTyping: {
      a: ['A*01', 'A*02'],
      b: ['B*08', 'B*40'],
      dr: ['DRB1*03', 'DRB1*15']
    },
    status: 'ACTIVE',
    createdAt: new Date(now - 2 * hour).toISOString(),
    donorAge: 34,
    donorGender: 'FEMALE',
    viabilityDeadline: new Date(now + 18 * hour).toISOString(),
    initialViabilityHours: 24,
    coldIschemiaMaxHours: 24,
    conditionNotes: 'Left kidney retrieved intact. Urine output > 100ml/hr prior to cross-clamp, Serum Creatinine 0.9 mg/dL.',
    donorCauseOfDeath: 'Intracerebral Hemorrhage'
  },

  // 3. PENDING_MATCH Donor Liver (Metro Gen proposed to St Jude)
  {
    id: 'L-DONOR-310',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Liver',
    bloodType: 'B+',
    hlaTyping: {
      a: ['A*11', 'A*24'],
      b: ['B*15', 'B*51'],
      dr: ['DRB1*09', 'DRB1*12']
    },
    status: 'PENDING_MATCH',
    createdAt: new Date(now - 4 * hour).toISOString(),
    donorAge: 41,
    donorGender: 'MALE',
    viabilityDeadline: new Date(now + 6 * hour).toISOString(),
    initialViabilityHours: 12,
    coldIschemiaMaxHours: 12,
    conditionNotes: 'Whole liver graft. Normal LFTs, macrosteatosis < 5%, biopsy confirmed normal histology.'
  },

  // 4. EXPIRED Donor Lung (Viability window elapsed)
  {
    id: 'L-DONOR-105-EXP',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Lung',
    bloodType: 'AB+',
    hlaTyping: {
      a: ['A*03', 'A*30'],
      b: ['B*07', 'B*18'],
      dr: ['DRB1*01', 'DRB1*11']
    },
    status: 'EXPIRED',
    createdAt: new Date(now - 14 * hour).toISOString(),
    donorAge: 52,
    donorGender: 'MALE',
    viabilityDeadline: new Date(now - 2 * hour).toISOString(), // Expired 2 hrs ago
    initialViabilityHours: 6,
    coldIschemiaMaxHours: 6,
    conditionNotes: 'Exceeded maximum safe 6-hour cold ischemia preservation limit. Organ retired per protocol.'
  },

  // 5. MATCHED Donor Kidney (Currently in Transport to City Med)
  {
    id: 'L-DONOR-902-TR',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Kidney',
    bloodType: 'O-',
    hlaTyping: {
      a: ['A*02', 'A*02'],
      b: ['B*44', 'B*44'],
      dr: ['DRB1*04', 'DRB1*04']
    },
    status: 'MATCHED',
    createdAt: new Date(now - 6 * hour).toISOString(),
    donorAge: 22,
    donorGender: 'FEMALE',
    viabilityDeadline: new Date(now + 14 * hour).toISOString(),
    initialViabilityHours: 24,
    coldIschemiaMaxHours: 24,
    conditionNotes: 'Right kidney, zero antigen mismatch with recipient. In active green corridor transit.'
  },

  // 6. COMPLETED Donor Cornea (Delivered and Transplanted Yesterday)
  {
    id: 'L-DONOR-712-CMP',
    hospitalId: 'hosp-metro-gen',
    hospitalName: 'Metro General Hospital & Trauma Center',
    hospitalCity: 'Bengaluru',
    type: 'DONOR',
    organType: 'Cornea',
    bloodType: 'A+',
    hlaTyping: { a: ['A*01'], b: ['B*08'], dr: ['DRB1*03'] },
    status: 'COMPLETED',
    createdAt: new Date(now - 2 * day).toISOString(),
    donorAge: 45,
    donorGender: 'MALE'
  },

  // RECIPIENT LISTINGS across partner hospitals:

  // 7. Critical Recipient Heart at St Jude (Matches L-DONOR-882)
  {
    id: 'L-REC-STJ-101',
    hospitalId: 'hosp-st-jude',
    hospitalName: 'St. Jude Heart & Lung Institute',
    hospitalCity: 'Chennai',
    type: 'RECIPIENT',
    organType: 'Heart',
    bloodType: 'O+',
    hlaTyping: {
      a: ['A*02', 'A*24'],
      b: ['B*35', 'B*44'],
      dr: ['DRB1*04', 'DRB1*07']
    },
    status: 'ACTIVE',
    createdAt: new Date(now - 120 * day).toISOString(),
    recipientAge: 38,
    recipientGender: 'FEMALE',
    urgencyLevel: '1A_CRITICAL',
    waitingSince: new Date(now - 120 * day).toISOString(),
    medicalCenterWard: 'Cardiac CCU Bed 4',
    recipientPatientId: 'PT-STJ-9941'
  },

  // 8. Recipient Kidney at Apollo Care (Matches L-DONOR-449)
  {
    id: 'L-REC-APL-204',
    hospitalId: 'hosp-apollo-care',
    hospitalName: 'Apollo Multi-Specialty Hospital',
    hospitalCity: 'Bengaluru',
    type: 'RECIPIENT',
    organType: 'Kidney',
    bloodType: 'A+',
    hlaTyping: {
      a: ['A*01', 'A*02'],
      b: ['B*08', 'B*40'],
      dr: ['DRB1*03', 'DRB1*15']
    },
    status: 'ACTIVE',
    createdAt: new Date(now - 240 * day).toISOString(),
    recipientAge: 44,
    recipientGender: 'MALE',
    urgencyLevel: '1B_URGENT',
    waitingSince: new Date(now - 240 * day).toISOString(),
    medicalCenterWard: 'Nephrology Ward 3B',
    recipientPatientId: 'PT-APL-8120'
  },

  // 9. Recipient Liver at St Jude (Target of pending match M-PROPOSED-1)
  {
    id: 'L-REC-STJ-305',
    hospitalId: 'hosp-st-jude',
    hospitalName: 'St. Jude Heart & Lung Institute',
    hospitalCity: 'Chennai',
    type: 'RECIPIENT',
    organType: 'Liver',
    bloodType: 'B+',
    hlaTyping: {
      a: ['A*11', 'A*24'],
      b: ['B*15', 'B*51'],
      dr: ['DRB1*09', 'DRB1*12']
    },
    status: 'PENDING_MATCH',
    createdAt: new Date(now - 90 * day).toISOString(),
    recipientAge: 51,
    recipientGender: 'MALE',
    urgencyLevel: '1A_CRITICAL',
    waitingSince: new Date(now - 90 * day).toISOString(),
    medicalCenterWard: 'Hepatology ICU 12',
    recipientPatientId: 'PT-STJ-7712'
  },

  // 10. Recipient Kidney at City Med (Target of active transport)
  {
    id: 'L-REC-CTY-408',
    hospitalId: 'hosp-city-med',
    hospitalName: 'City Medical University Hospital',
    hospitalCity: 'Hyderabad',
    type: 'RECIPIENT',
    organType: 'Kidney',
    bloodType: 'O-',
    hlaTyping: {
      a: ['A*02', 'A*02'],
      b: ['B*44', 'B*44'],
      dr: ['DRB1*04', 'DRB1*04']
    },
    status: 'MATCHED',
    createdAt: new Date(now - 310 * day).toISOString(),
    recipientAge: 19,
    recipientGender: 'FEMALE',
    urgencyLevel: '1A_CRITICAL',
    waitingSince: new Date(now - 310 * day).toISOString(),
    medicalCenterWard: 'Pediatric Renal Unit 4',
    recipientPatientId: 'PT-CTY-3301'
  },

  // 11. Recipient Heart at Apollo (Alternative Candidate for Heart)
  {
    id: 'L-REC-APL-502',
    hospitalId: 'hosp-apollo-care',
    hospitalName: 'Apollo Multi-Specialty Hospital',
    hospitalCity: 'Bengaluru',
    type: 'RECIPIENT',
    organType: 'Heart',
    bloodType: 'O+',
    hlaTyping: {
      a: ['A*02', 'A*01'],
      b: ['B*35', 'B*08'],
      dr: ['DRB1*04', 'DRB1*03']
    },
    status: 'ACTIVE',
    createdAt: new Date(now - 60 * day).toISOString(),
    recipientAge: 56,
    recipientGender: 'MALE',
    urgencyLevel: '1B_URGENT',
    waitingSince: new Date(now - 60 * day).toISOString(),
    medicalCenterWard: 'Cardiology Ward 5A',
    recipientPatientId: 'PT-APL-4099'
  }
];

export const SEED_MATCHES: Match[] = [
  // 1. Proposed Match (Metro Gen Liver -> St Jude)
  {
    id: 'MATCH-PROP-001',
    donorListingId: 'L-DONOR-310',
    recipientListingId: 'L-REC-STJ-305',
    donorListing: SEED_LISTINGS[2],
    recipientListing: SEED_LISTINGS[8],
    proposingHospitalId: 'hosp-metro-gen',
    receivingHospitalId: 'hosp-st-jude',
    proposingHospitalName: 'Metro General Hospital & Trauma Center',
    receivingHospitalName: 'St. Jude Heart & Lung Institute',
    compatibilityScore: 96,
    distanceKm: 310,
    travelTimeMinutes: 85,
    breakdown: {
      bloodGroup: 100,
      hlaScore: 94,
      distanceScore: 78,
      urgencyScore: 100,
      viabilityFeasible: true
    },
    status: 'PROPOSED',
    proposedAt: new Date(now - 25 * 60 * 1000).toISOString(),
    respondByDeadline: new Date(now + 35 * 60 * 1000).toISOString(), // 35m countdown left
    activeLockedListingIds: ['L-DONOR-310', 'L-REC-STJ-305']
  },

  // 2. Confirmed Match in Active Transport (Metro Gen Kidney -> City Med)
  {
    id: 'MATCH-CONF-002',
    donorListingId: 'L-DONOR-902-TR',
    recipientListingId: 'L-REC-CTY-408',
    donorListing: SEED_LISTINGS[4],
    recipientListing: SEED_LISTINGS[9],
    proposingHospitalId: 'hosp-metro-gen',
    receivingHospitalId: 'hosp-city-med',
    proposingHospitalName: 'Metro General Hospital & Trauma Center',
    receivingHospitalName: 'City Medical University Hospital',
    compatibilityScore: 98,
    distanceKm: 510,
    travelTimeMinutes: 120,
    breakdown: {
      bloodGroup: 100,
      hlaScore: 100,
      distanceScore: 65,
      urgencyScore: 100,
      viabilityFeasible: true
    },
    status: 'CONFIRMED',
    proposedAt: new Date(now - 3 * hour).toISOString(),
    respondedAt: new Date(now - 2.5 * hour).toISOString(),
    respondByDeadline: new Date(now - 2 * hour).toISOString(),
    activeLockedListingIds: ['L-DONOR-902-TR', 'L-REC-CTY-408']
  },

  // 3. Historical Auto-Declined Match (Timeout simulated)
  {
    id: 'MATCH-HIST-AUTODEC',
    donorListingId: 'L-DONOR-HIST-01',
    recipientListingId: 'L-REC-HIST-01',
    donorListing: {
      ...SEED_LISTINGS[0],
      id: 'L-DONOR-HIST-01',
      organType: 'Heart',
      bloodType: 'B+'
    },
    recipientListing: {
      ...SEED_LISTINGS[6],
      id: 'L-REC-HIST-01',
      organType: 'Heart',
      bloodType: 'B+'
    },
    proposingHospitalId: 'hosp-metro-gen',
    receivingHospitalId: 'hosp-st-jude',
    proposingHospitalName: 'Metro General Hospital & Trauma Center',
    receivingHospitalName: 'St. Jude Heart & Lung Institute',
    compatibilityScore: 91,
    distanceKm: 310,
    travelTimeMinutes: 85,
    breakdown: {
      bloodGroup: 100,
      hlaScore: 88,
      distanceScore: 78,
      urgencyScore: 95,
      viabilityFeasible: true
    },
    status: 'AUTO_DECLINED',
    proposedAt: new Date(now - 3 * day).toISOString(),
    respondByDeadline: new Date(now - 3 * day + 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(now - 3 * day + 60 * 60 * 1000).toISOString(),
    declineReason: 'Auto-declined — no response received within 60-minute critical response window.',
    activeLockedListingIds: []
  },

  // 4. Completed Match (Transplanted yesterday)
  {
    id: 'MATCH-HIST-CMP-004',
    donorListingId: 'L-DONOR-712-CMP',
    recipientListingId: 'L-REC-HIST-CORNEA',
    donorListing: SEED_LISTINGS[5],
    recipientListing: {
      ...SEED_LISTINGS[7],
      id: 'L-REC-HIST-CORNEA',
      organType: 'Cornea',
      bloodType: 'A+'
    },
    proposingHospitalId: 'hosp-metro-gen',
    receivingHospitalId: 'hosp-apollo-care',
    proposingHospitalName: 'Metro General Hospital & Trauma Center',
    receivingHospitalName: 'Apollo Multi-Specialty Hospital',
    compatibilityScore: 97,
    distanceKm: 15,
    travelTimeMinutes: 30,
    breakdown: {
      bloodGroup: 100,
      hlaScore: 95,
      distanceScore: 100,
      urgencyScore: 90,
      viabilityFeasible: true
    },
    status: 'COMPLETED',
    proposedAt: new Date(now - 2 * day).toISOString(),
    respondedAt: new Date(now - 2 * day + 15 * 60 * 1000).toISOString(),
    respondByDeadline: new Date(now - 2 * day + 2 * hour).toISOString(),
    activeLockedListingIds: []
  }
];

export const SEED_TRANSPORTS: Transport[] = [
  {
    matchId: 'MATCH-CONF-002',
    match: SEED_MATCHES[1],
    status: 'IN_TRANSIT',
    preservationBoxId: 'LIFELINK-PERFUSION-BOX-X89',
    currentTemperature: 3.8,
    targetTempMin: 2.0,
    targetTempMax: 6.0,
    batteryLevel: 89,
    gpsSpeedKmH: 74,
    originHospital: 'Metro General Hospital & Trauma Center, Bengaluru',
    destinationHospital: 'City Medical University Hospital, Hyderabad',
    etaMinutes: 48,
    dispatchedAt: new Date(now - 90 * 60 * 1000).toISOString(),
    inTransitAt: new Date(now - 75 * 60 * 1000).toISOString(),
    transportVehicle: 'GREEN_CORRIDOR_AMBULANCE',
    trackingNumber: 'LL-TRK-2026-90822',
    driverContact: {
      name: 'Ramesh Kumar (Emergency Pilot)',
      phone: '+91 98765 43210'
    },
    checkpoints: [
      {
        title: 'Organ Retrieval & Cross-Clamp Sign-off',
        timestamp: new Date(now - 120 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        location: 'Metro General Hospital OT-4'
      },
      {
        title: 'Preservation Box Secured & Dispatched',
        timestamp: new Date(now - 90 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        location: 'Metro General Ambulance Bay'
      },
      {
        title: 'Green Corridor Tollway Transit (Highway NH44)',
        timestamp: new Date(now - 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        location: 'Anantapur Transit Corridor'
      },
      {
        title: 'City Police Escort Intercept Point',
        completed: false,
        location: 'Hyderabad Outer Ring Road Junction'
      },
      {
        title: 'Transplant OT Handoff & Recipient Crossmatch',
        completed: false,
        location: 'City Medical University OT-2'
      }
    ]
  }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    hospitalId: 'hosp-metro-gen',
    title: 'Urgent Viability Warning: Heart (O+)',
    message: 'Donor listing #H-882 has 45 minutes remaining in cold ischemia window. 2 ranked recipients available.',
    type: 'URGENT_MATCH',
    timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
    read: false,
    link: '/listings/L-DONOR-882/matches',
    isUrgent: true
  },
  {
    id: 'notif-2',
    hospitalId: 'hosp-st-jude',
    title: 'New Incoming Match Proposal: Liver (B+)',
    message: 'Metro General Hospital has proposed donor liver for recipient Patient PT-STJ-7712. 35m response window remaining.',
    type: 'PROPOSAL_RECEIVED',
    timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
    read: false,
    link: '/requests',
    isUrgent: true
  },
  {
    id: 'notif-3',
    hospitalId: 'hosp-metro-gen',
    title: 'Live Transport Update: Kidney (O-)',
    message: 'Preservation Unit LL-TRK-2026-90822 is In Transit to Hyderabad. Temp stable at 3.8°C. ETA 48 mins.',
    type: 'TRANSPORT_UPDATE',
    timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
    read: true,
    link: '/transport/MATCH-CONF-002'
  },
  {
    id: 'notif-4',
    targetRole: 'ADMIN',
    title: 'New Hospital Accreditation Application',
    message: 'Hope Regional Specialty Hospital has submitted registration documents for NOTTO verification.',
    type: 'REGISTRATION_STATUS',
    timestamp: new Date(now - 2 * hour).toISOString(),
    read: false,
    link: '/admin/queue'
  }
];
