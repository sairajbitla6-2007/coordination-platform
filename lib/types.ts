export type HospitalStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export type UserRole = 'HOSPITAL_USER' | 'ADMIN' | 'UNREGISTERED_HOSPITAL';

export interface Hospital {
  id: string;
  name: string;
  licenseNumber: string;
  hospitalType: 'TRANSPLANT_CENTER' | 'RECOVERY_CENTER' | 'GOVERNMENT_MEDICAL_COLLEGE' | 'SPECIALTY_HOSPITAL';
  address: string;
  city: string;
  state: string;
  pincode: string;
  adminContact: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    url?: string;
  }[];
  status: HospitalStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  avatarUrl?: string;
}

export type OrganType = 'Kidney' | 'Liver' | 'Heart' | 'Lung' | 'Pancreas' | 'Intestine' | 'Cornea';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type ListingType = 'DONOR' | 'RECIPIENT';

export type ListingStatus = 'ACTIVE' | 'PENDING_MATCH' | 'MATCHED' | 'EXPIRED' | 'COMPLETED';

export type UrgencyLevel = '1A_CRITICAL' | '1B_URGENT' | '2_STANDARD';

export interface HLATyping {
  a: string[];
  b: string[];
  dr: string[];
  dq?: string[];
}

export interface Listing {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  type: ListingType;
  organType: OrganType;
  bloodType: BloodType;
  hlaTyping: HLATyping;
  status: ListingStatus;
  createdAt: string; // ISO String

  // Donor Specific fields
  donorAge?: number;
  donorGender?: 'MALE' | 'FEMALE' | 'OTHER';
  viabilityDeadline?: string; // ISO String (hard cutoff for cold ischemia)
  initialViabilityHours?: number;
  coldIschemiaMaxHours?: number;
  conditionNotes?: string;
  donorCauseOfDeath?: string;

  // Recipient Specific fields
  recipientAge?: number;
  recipientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  urgencyLevel?: UrgencyLevel;
  waitingSince?: string; // ISO String
  medicalCenterWard?: string;
  recipientPatientId?: string;
}

export type MatchStatus = 'PROPOSED' | 'CONFIRMED' | 'DECLINED' | 'AUTO_DECLINED' | 'COMPLETED';

export interface MatchScoreBreakdown {
  bloodGroup: number; // 0 - 100
  hlaScore: number;   // 0 - 100
  distanceScore: number; // 0 - 100
  urgencyScore: number;  // 0 - 100
  viabilityFeasible: boolean;
}

export interface MatchCandidate {
  recipientListing: Listing;
  compatibilityScore: number;
  distanceKm: number;
  estimatedTransitMinutes: number;
  breakdown: MatchScoreBreakdown;
  rank: number;
}

export interface Match {
  id: string;
  donorListingId: string;
  recipientListingId: string;
  donorListing: Listing;
  recipientListing: Listing;
  proposingHospitalId: string;
  receivingHospitalId: string;
  proposingHospitalName: string;
  receivingHospitalName: string;
  compatibilityScore: number;
  distanceKm: number;
  travelTimeMinutes: number;
  breakdown: MatchScoreBreakdown;
  status: MatchStatus;
  respondByDeadline: string; // ISO String
  proposedAt: string;
  respondedAt?: string;
  declineReason?: string;
  activeLockedListingIds: string[];
}

export type TransportStatus = 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';

export interface Transport {
  matchId: string;
  match: Match;
  status: TransportStatus;
  preservationBoxId: string;
  currentTemperature: number; // in Celsius e.g. 3.8
  targetTempMin: number;
  targetTempMax: number;
  batteryLevel: number; // 0 - 100 %
  gpsSpeedKmH: number;
  originHospital: string;
  destinationHospital: string;
  etaMinutes: number;
  dispatchedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  transportVehicle: 'GREEN_CORRIDOR_AMBULANCE' | 'MEDICAL_CHARTER_FLIGHT' | 'RAPID_ORGAN_LOGISTICS';
  trackingNumber: string;
  driverContact: {
    name: string;
    phone: string;
  };
  checkpoints: {
    title: string;
    timestamp?: string;
    completed: boolean;
    location: string;
  }[];
}

export interface NotificationItem {
  id: string;
  hospitalId?: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: 'URGENT_MATCH' | 'PROPOSAL_RECEIVED' | 'MATCH_CONFIRMED' | 'MATCH_DECLINED' | 'AUTO_DECLINED' | 'TRANSPORT_UPDATE' | 'REGISTRATION_STATUS' | 'EXPIRED_ALERT';
  timestamp: string;
  read: boolean;
  link?: string;
  isUrgent?: boolean;
}
