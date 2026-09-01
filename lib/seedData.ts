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
    rejectionReason: 'Inadequate modular OT facility for cold preservation retrieval. Facility is not certified as a Level-1 organ recovery or surgical transplant center under guidelines.'
  }
];

// Reference timestamps relative to runtime
const now = Date.now();

export const SEED_LISTINGS: Listing[] = [];

export const SEED_MATCHES: Match[] = [];

export const SEED_TRANSPORTS: Transport[] = [];

export const SEED_NOTIFICATIONS: NotificationItem[] = [];
