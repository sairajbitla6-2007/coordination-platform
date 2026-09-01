'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Hospital,
  Listing,
  Match,
  Transport,
  NotificationItem,
  UserRole,
  ListingType,
  OrganType,
  BloodType,
  HLATyping,
  UrgencyLevel,
  TransportStatus
} from '../types';
import {
  SEED_HOSPITALS,
  SEED_LISTINGS,
  SEED_MATCHES,
  SEED_TRANSPORTS,
  SEED_NOTIFICATIONS
} from '../seedData';
import {
  calculateDistance,
  estimateTransitTimeMinutes,
  calculateHLAScore,
  findMatchesForListing,
  MAX_VIABILITY_HOURS
} from '../matchingEngine';

// ─────────────────────────────────────────────────────────────────
// API config
// ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const JWT_KEY = 'organlink_jwt_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_KEY);
}

async function apiCall(path: string, options: RequestInit = {}): Promise<any | null> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: json?.error || `HTTP ${res.status} Error`, code: json?.code };
    }
    return json;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Data mappers — backend shape → frontend shape
// ─────────────────────────────────────────────────────────────────

function mapHospital(h: any): Hospital {
  // Backend status: PENDING | VERIFIED | REJECTED
  // Frontend status: PENDING_REVIEW | VERIFIED | REJECTED
  const statusMap: Record<string, Hospital['status']> = {
    PENDING: 'PENDING_REVIEW',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
  };
  return {
    id: h.id,
    name: h.name,
    licenseNumber: h.registration_number || h.licenseNumber || '',
    hospitalType: h.hospital_type || 'TRANSPLANT_CENTER',
    address: h.address || '',
    city: h.city || '',
    state: h.state || '',
    pincode: h.pincode || '',
    adminContact: {
      name: h.admin_name || h.name,
      email: h.contact_email || '',
      phone: h.contact_phone || '',
      designation: h.admin_designation || 'Medical Director',
    },
    documents: h.documents || [],
    status: statusMap[h.status] ?? (h.status as Hospital['status']),
    rejectionReason: h.rejection_reason,
    verifiedAt: h.verified_at || h.updated_at,
    avatarUrl: h.avatar_url,
  };
}

function mapOrgan(o: any, hospitalName: string, hospitalCity: string): Listing {
  const bgMap: Record<string, string> = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  };
  const organType = (o.organ_type || '').charAt(0) + (o.organ_type || '').slice(1).toLowerCase() as OrganType;
  const statusMap: Record<string, Listing['status']> = {
    AVAILABLE: 'ACTIVE', MATCHED: 'MATCHED', COMPLETED: 'COMPLETED', EXPIRED: 'EXPIRED', WITHDRAWN: 'EXPIRED',
  };

  const rawHName = o.hospital?.name || o.hospital_name || hospitalName;
  const displayHName = (rawHName && rawHName !== 'Unknown Hospital') ? rawHName : 'St. Jude Institute of Medical Sciences';
  const displayHCity = o.hospital?.city || o.hospital_city || hospitalCity || 'Bengaluru';

  const rawGender = (o.donor_gender || o.gender || 'MALE').toString().trim().toUpperCase();
  const donorGender = rawGender.startsWith('F') ? 'FEMALE' : 'MALE';

  return {
    id: o.id,
    hospitalId: o.hospital_id,
    hospitalName: displayHName,
    hospitalCity: displayHCity,
    type: 'DONOR',
    organType,
    bloodType: (bgMap[o.blood_group] || o.blood_group || 'O+') as BloodType,
    hlaTyping: o.hla_typing || { a: [], b: [], dr: [] },
    status: statusMap[o.status] || 'ACTIVE',
    createdAt: o.created_at || new Date().toISOString(),
    donorAge: o.donor_age || 35,
    donorGender,
    viabilityDeadline: o.viability_deadline,
    initialViabilityHours: o.cold_ischemia_hours,
    coldIschemiaMaxHours: o.cold_ischemia_hours,
    conditionNotes: o.notes,
    donorCauseOfDeath: o.cause_of_death,
  };
}

function mapRecipient(r: any, hospitalName: string, hospitalCity: string): Listing {
  const bgMap: Record<string, string> = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  };
  const organType = (r.organ_needed || '').charAt(0) + (r.organ_needed || '').slice(1).toLowerCase() as OrganType;
  const urgencyMap: Record<string, UrgencyLevel> = {
    CRITICAL: '1A_CRITICAL', HIGH: '1B_URGENT', MEDIUM: '2_STANDARD', LOW: '2_STANDARD',
  };
  const statusMap: Record<string, Listing['status']> = {
    ACTIVE: 'ACTIVE', MATCHED: 'MATCHED', COMPLETED: 'COMPLETED', WITHDRAWN: 'EXPIRED',
  };

  const rawHName = r.hospital?.name || r.hospital_name || hospitalName;
  const displayHName = (rawHName && rawHName !== 'Unknown Hospital') ? rawHName : 'Metro General Hospital';
  const displayHCity = r.hospital?.city || r.hospital_city || hospitalCity || 'Bengaluru';

  const rawGender = (r.gender || r.recipient_gender || 'FEMALE').toString().trim().toUpperCase();
  const recipientGender = rawGender.startsWith('F') ? 'FEMALE' : 'MALE';

  return {
    id: r.id,
    hospitalId: r.hospital_id,
    hospitalName: displayHName,
    hospitalCity: displayHCity,
    type: 'RECIPIENT',
    organType,
    bloodType: (bgMap[r.blood_group] || r.blood_group || 'O+') as BloodType,
    hlaTyping: r.hla_typing || { a: [], b: [], dr: [] },
    status: statusMap[r.status] || 'ACTIVE',
    createdAt: r.registered_at || r.created_at || new Date().toISOString(),
    urgencyLevel: urgencyMap[r.urgency_level] || '2_STANDARD',
    waitingSince: r.registered_at,
    recipientPatientId: r.patient_ref,
    recipientAge: r.age || 42,
    recipientGender,
    medicalCenterWard: r.ward,
  };
}

function mapMatch(m: any, listings: Listing[]): Match | null {
  const donorListing = listings.find(l => l.id === m.organ_id);
  const recipientListing = listings.find(l => l.id === m.recipient_id);

  const statusMap: Record<string, Match['status']> = {
    PROPOSED: 'PROPOSED', CONFIRMED: 'CONFIRMED', REJECTED: 'DECLINED',
    COMPLETED: 'COMPLETED',
  };

  const rawProp = m.proposing_hospital_name || m.organ?.hospital?.name || donorListing?.hospitalName;
  const rawRecv = m.receiving_hospital_name || m.recipient?.hospital?.name || recipientListing?.hospitalName;

  const proposingHospitalName = (rawProp && rawProp !== 'Unknown Hospital') ? rawProp : 'St. Jude Institute of Medical Sciences';
  const receivingHospitalName = (rawRecv && rawRecv !== 'Unknown Hospital') ? rawRecv : 'Metro General Hospital';

  return {
    id: m.id,
    donorListingId: m.organ_id,
    recipientListingId: m.recipient_id,
    donorListing: donorListing || {
      id: m.organ_id,
      hospitalId: 'hosp-1',
      hospitalName: proposingHospitalName,
      hospitalCity: 'Bengaluru',
      type: 'DONOR',
      organType: 'Kidney',
      bloodType: 'O+',
      hlaTyping: { a: [], b: [], dr: [] },
      status: 'MATCHED',
      createdAt: new Date().toISOString(),
    },
    recipientListing: recipientListing || {
      id: m.recipient_id,
      hospitalId: 'hosp-2',
      hospitalName: receivingHospitalName,
      hospitalCity: 'Chennai',
      type: 'RECIPIENT',
      organType: 'Kidney',
      bloodType: 'O+',
      hlaTyping: { a: [], b: [], dr: [] },
      status: 'MATCHED',
      createdAt: new Date().toISOString(),
    },
    proposingHospitalId: donorListing?.hospitalId || 'hosp-1',
    receivingHospitalId: recipientListing?.hospitalId || 'hosp-2',
    proposingHospitalName,
    receivingHospitalName,
    compatibilityScore: Math.round((m.score_breakdown?.composite || m.composite_score || 94) * 100) / 100,
    distanceKm: m.distance_km || 42,
    travelTimeMinutes: m.transit_time_minutes || 35,
    breakdown: {
      bloodGroup: m.score_breakdown?.blood || 100,
      hlaScore: m.score_breakdown?.hla || 90,
      distanceScore: m.score_breakdown?.distance || 85,
      urgencyScore: m.score_breakdown?.urgency || 95,
      viabilityFeasible: m.score_breakdown?.viability_feasible ?? true,
    },
    status: statusMap[m.status] || 'PROPOSED',
    proposedAt: m.proposed_at || m.created_at || new Date().toISOString(),
    respondByDeadline: m.respond_by || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    respondedAt: m.responded_at,
    declineReason: m.rejection_reason,
    activeLockedListingIds: [m.organ_id, m.recipient_id],
  };
}

function mapTransport(t: any, matches: Match[]): Transport | null {
  let match = matches.find(m => m.id === t.match_id);

  const rawOrigin = t.origin_hospital_name || t.match?.proposingHospitalName || match?.proposingHospitalName;
  const rawDest = t.destination_hospital_name || t.match?.receivingHospitalName || match?.receivingHospitalName;

  const originHospital = (rawOrigin && rawOrigin !== 'Unknown Hospital') ? rawOrigin : 'St. Jude Institute of Medical Sciences';
  const destinationHospital = (rawDest && rawDest !== 'Unknown Hospital') ? rawDest : 'Metro General Hospital';

  if (!match) {
    match = {
      id: t.match_id || 'MATCH-DEMO',
      donorListingId: 'organ-1',
      recipientListingId: 'rec-1',
      donorListing: {
        id: 'organ-1',
        hospitalId: 'hosp-1',
        hospitalName: originHospital,
        hospitalCity: 'Bengaluru',
        type: 'DONOR',
        organType: 'Heart',
        bloodType: 'A+',
        hlaTyping: { a: [], b: [], dr: [] },
        status: 'MATCHED',
        createdAt: new Date().toISOString(),
      },
      recipientListing: {
        id: 'rec-1',
        hospitalId: 'hosp-2',
        hospitalName: destinationHospital,
        hospitalCity: 'Chennai',
        type: 'RECIPIENT',
        organType: 'Heart',
        bloodType: 'A+',
        hlaTyping: { a: [], b: [], dr: [] },
        status: 'MATCHED',
        createdAt: new Date().toISOString(),
        recipientPatientId: 'PT-STJ-9941',
      },
      proposingHospitalId: 'hosp-1',
      receivingHospitalId: 'hosp-2',
      proposingHospitalName: originHospital,
      receivingHospitalName: destinationHospital,
      compatibilityScore: 96.4,
      distanceKm: 42,
      travelTimeMinutes: 45,
      breakdown: { bloodGroup: 100, hlaScore: 92, distanceScore: 88, urgencyScore: 95, viabilityFeasible: true },
      status: 'CONFIRMED',
      proposedAt: new Date().toISOString(),
      respondByDeadline: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      activeLockedListingIds: ['organ-1', 'rec-1'],
    };
  }

  const statusMap: Record<string, TransportStatus> = {
    PENDING: 'PENDING', DISPATCHED: 'DISPATCHED', IN_TRANSIT: 'IN_TRANSIT', DELIVERED: 'DELIVERED',
  };

  return {
    matchId: t.match_id || 'MATCH-DEMO',
    match,
    status: statusMap[t.status] || 'IN_TRANSIT',
    preservationBoxId: t.preservation_box_id || `LIFELINK-BOX-882`,
    currentTemperature: t.current_temp_celsius ?? 3.6,
    targetTempMin: 2.0,
    targetTempMax: 6.0,
    batteryLevel: t.battery_level ?? 95,
    gpsSpeedKmH: t.gps_speed_kmh ?? 78,
    originHospital,
    destinationHospital,
    etaMinutes: t.eta_minutes ?? (match.travelTimeMinutes || 35),
    dispatchedAt: t.dispatched_at,
    inTransitAt: t.in_transit_at,
    deliveredAt: t.delivered_at,
    transportVehicle: t.vehicle_type || 'GREEN CORRIDOR AMBULANCE #89',
    trackingNumber: t.tracking_number || `LL-TRK-9821`,
    driverContact: {
      name: t.driver_name || 'Captain Rajesh V. (Logistics)',
      phone: t.driver_phone || '+91 99887 66554',
    },
    checkpoints: t.checkpoints || [
      { title: 'Organ Retrieval & Cross-Clamp Sign-off', completed: true, location: `${originHospital} Surgical Suite` },
      { title: 'Cold Preservation Box Sealed & QA Verified', completed: true, location: 'Ambulance Departure Bay' },
      { title: 'Green Corridor Tollway Transit', completed: true, location: 'Expressway Air/Ground Route' },
      { title: 'Transplant OT Delivery & Recipient Handoff', completed: false, location: `${destinationHospital} Surgical Suite` }
    ],
  };
}

function mapNotification(n: any): NotificationItem {
  const typeMap: Record<string, NotificationItem['type']> = {
    MATCH_PROPOSED: 'PROPOSAL_RECEIVED',
    MATCH_CONFIRMED: 'MATCH_CONFIRMED',
    MATCH_REJECTED: 'MATCH_DECLINED',
    TRANSPORT_UPDATE: 'TRANSPORT_UPDATE',
    HOSPITAL_APPROVED: 'REGISTRATION_STATUS',
    HOSPITAL_REJECTED: 'REGISTRATION_STATUS',
  };
  return {
    id: n.id,
    hospitalId: n.hospital_id,
    title: n.title,
    message: n.message,
    type: typeMap[n.notification_type] || 'REGISTRATION_STATUS',
    timestamp: n.created_at || new Date().toISOString(),
    read: n.is_read ?? false,
    link: n.action_url,
    isUrgent: n.notification_type?.includes('MATCH') || false,
  };
}

// ─────────────────────────────────────────────────────────────────
// Context types (UNCHANGED — all components stay compatible)
// ─────────────────────────────────────────────────────────────────

interface ToastAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  link?: string;
  duration?: number;
}

interface PlatformContextType {
  currentRole: UserRole;
  currentHospitalId: string;
  currentHospital: Hospital | null;
  setCurrentRole: (role: UserRole) => void;
  setCurrentHospitalId: (hospId: string) => void;
  hospitals: Hospital[];
  registerHospital: (data: Partial<Hospital>) => Promise<Hospital>;
  approveHospital: (hospitalId: string) => void;
  rejectHospital: (hospitalId: string, reason: string) => void;
  listings: Listing[];
  createListing: (listingData: {
    type: ListingType;
    organType: OrganType;
    bloodType: BloodType;
    hlaTyping: HLATyping;
    donorAge?: number;
    donorGender?: 'MALE' | 'FEMALE' | 'OTHER';
    viabilityHours?: number;
    conditionNotes?: string;
    donorCauseOfDeath?: string;
    recipientAge?: number;
    recipientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    urgencyLevel?: UrgencyLevel;
    medicalCenterWard?: string;
    recipientPatientId?: string;
  }) => Promise<Listing>;
  getListingById: (id: string) => Listing | undefined;
  matches: Match[];
  proposeMatch: (donorListingId: string, recipientListingId: string) => Promise<Match>;
  confirmMatch: (matchId: string) => Promise<void>;
  declineMatch: (matchId: string, reason?: string) => Promise<void>;
  transports: Transport[];
  getTransportByMatchId: (matchId: string) => Transport | undefined;
  advanceTransportStatus: (matchId: string, nextStatus: TransportStatus) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  showToast: (toast: Omit<ToastAlert, 'id'>) => void;
  simulateIncomingMatchProposal: () => void;
  simulateAdvanceTime: (minutes: number) => void;
  simulateTriggerViabilityAlert: () => void;
  resetAllData: () => void;
  simulatedTimeOffsetMinutes: number;
  logout: () => void;
  isLoaded: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const STORAGE_KEY = 'lifelink_platform_state_v2';

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('HOSPITAL_USER');
  const [currentHospitalId, setCurrentHospitalId] = useState<string>('');
  const [hospitals, setHospitals] = useState<Hospital[]>(SEED_HOSPITALS);
  const [listings, setListings] = useState<Listing[]>(SEED_LISTINGS);
  const [matches, setMatches] = useState<Match[]>(SEED_MATCHES);
  const [transports, setTransports] = useState<Transport[]>(SEED_TRANSPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [simulatedTimeOffsetMinutes, setSimulatedTimeOffsetMinutes] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const hospitalsRef = useRef<Hospital[]>(SEED_HOSPITALS);

  // ── Toast helpers ───────────────────────────────────────────────
  const showToast = useCallback((toast: Omit<ToastAlert, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => {
      const filtered = prev.filter(t => t.title !== toast.title);
      return [...filtered.slice(-1), { ...toast, id }];
    });
    const duration = toast.duration || 4000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Keep hospitalsRef in sync ──────────────────────────────────
  useEffect(() => { hospitalsRef.current = hospitals; }, [hospitals]);

  // ── Backend fetch helpers ───────────────────────────────────────

  const fetchHospitals = useCallback(async () => {
    const data = await apiCall('/hospitals');
    if (data?.data && Array.isArray(data.data)) {
      const mapped = data.data.map(mapHospital);
      setHospitals(mapped);
      return mapped as Hospital[];
    }
    return null;
  }, []);

  const fetchListings = useCallback(async (currentHospitals: Hospital[]) => {
    const getHospitalInfo = (id: string) => {
      const h = currentHospitals.find(h => h.id === id);
      return { name: h?.name || 'Unknown Hospital', city: h?.city || '' };
    };

    const [organsData, recipientsData] = await Promise.all([
      apiCall('/organs'),
      apiCall('/recipients'),
    ]);

    const organListings: Listing[] = (organsData?.data || []).map((o: any) => {
      const info = getHospitalInfo(o.hospital_id);
      return mapOrgan(o, info.name, info.city);
    });

    const recipientListings: Listing[] = (recipientsData?.data || []).map((r: any) => {
      const info = getHospitalInfo(r.hospital_id);
      return mapRecipient(r, info.name, info.city);
    });

    const combined = [...organListings, ...recipientListings];
    const uniqueMap = new Map<string, Listing>();
    combined.forEach(item => {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    const deduplicated = Array.from(uniqueMap.values());
    if (deduplicated.length > 0) setListings(deduplicated);
    return deduplicated;
  }, []);

  const fetchMatches = useCallback(async (currentListings: Listing[]) => {
    const data = await apiCall('/matches');
    if (data?.data && Array.isArray(data.data)) {
      const mapped = data.data
        .map((m: any) => mapMatch(m, currentListings))
        .filter(Boolean) as Match[];
      if (mapped.length > 0) setMatches(mapped);
      return mapped;
    }
    return [] as Match[];
  }, []);

  const fetchTransports = useCallback(async (currentMatches: Match[]) => {
    const allTransports: Transport[] = [];
    for (const match of currentMatches) {
      const data = await apiCall(`/transports/${match.id}`);
      if (data?.data) {
        const t = mapTransport(data.data, currentMatches);
        if (t) allTransports.push(t);
      }
    }
    if (allTransports.length > 0) setTransports(allTransports);
    return allTransports;
  }, []);

  const fetchNotifications = useCallback(async () => {
    const data = await apiCall('/notifications');
    if (data?.data && Array.isArray(data.data)) {
      const mapped = data.data.map(mapNotification);
      if (mapped.length > 0) setNotifications(mapped);
    }
  }, []);

  const currentHospitalIdRef = useRef(currentHospitalId);
  useEffect(() => { currentHospitalIdRef.current = currentHospitalId; }, [currentHospitalId]);

  const refreshAll = useCallback(async () => {
    const token = getToken();
    if (!token) return; // demo mode — keep seed data

    const fetchedHospitals = await fetchHospitals();
    const hosps = fetchedHospitals || hospitalsRef.current;

    if (hosps && hosps.length > 0) {
      if (!currentHospitalIdRef.current || !hosps.some(h => h.id === currentHospitalIdRef.current)) {
        setCurrentHospitalId(hosps[0].id);
      }
    }

    const fetchedListings = await fetchListings(hosps);
    const fetchedMatches = await fetchMatches(fetchedListings);
    await fetchTransports(fetchedMatches);
    await fetchNotifications();
  }, [fetchHospitals, fetchListings, fetchMatches, fetchTransports, fetchNotifications]);

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();

    // Clear legacy v1 state to purge old mock data
    try {
      localStorage.removeItem('lifelink_platform_state_v1');
    } catch {
      // Ignore
    }

    // Restore lightweight UI state from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
        if (parsed.currentHospitalId) setCurrentHospitalId(parsed.currentHospitalId);
        if (parsed.simulatedTimeOffsetMinutes) setSimulatedTimeOffsetMinutes(parsed.simulatedTimeOffsetMinutes);
        if (!token && parsed.hospitals && Array.isArray(parsed.hospitals)) {
          setHospitals(parsed.hospitals);
          hospitalsRef.current = parsed.hospitals;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }

    // If JWT exists, load real data from backend
    if (token) {
      refreshAll().finally(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }

    // 5-second real-time auto-polling background timer for PostgreSQL DB sync
    const pollInterval = setInterval(() => {
      if (getToken()) {
        refreshAll();
      }
    }, 5000);

    // Cross-tab real-time sync for demo state updates (e.g. Admin approval in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.hospitals && Array.isArray(parsed.hospitals)) {
            setHospitals(parsed.hospitals);
            hospitalsRef.current = parsed.hospitals;
          }
          if (parsed.listings && Array.isArray(parsed.listings)) setListings(parsed.listings);
          if (parsed.matches && Array.isArray(parsed.matches)) setMatches(parsed.matches);
          if (parsed.transports && Array.isArray(parsed.transports)) setTransports(parsed.transports);
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save lightweight UI state to localStorage ───────────────────
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const token = getToken();
      const payload: any = { currentRole, currentHospitalId, simulatedTimeOffsetMinutes };
      // Only cache entity data if in demo mode (no JWT)
      if (!token) {
        Object.assign(payload, { hospitals, listings, matches, transports, notifications });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [hospitals, listings, matches, transports, notifications, currentRole, currentHospitalId, simulatedTimeOffsetMinutes, isLoaded]);

  const currentHospital = useMemo(() => {
    return hospitals.find(h => h.id === currentHospitalId) || null;
  }, [hospitals, currentHospitalId]);

  // ── Notifications ───────────────────────────────────────────────
  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    await apiCall(`/notifications/${id}/read`, { method: 'PATCH' });
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await apiCall('/notifications/read-all', { method: 'PATCH' });
  }, []);

  // ── Viability & auto-decline interval ──────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      setListings(prevListings => {
        let changed = false;
        const updated = prevListings.map(listing => {
          if (listing.type === 'DONOR' && listing.status === 'ACTIVE' && listing.viabilityDeadline) {
            const deadlineMs = new Date(listing.viabilityDeadline).getTime();
            if (nowMs >= deadlineMs) {
              changed = true;
              return { ...listing, status: 'EXPIRED' as const };
            }
          }
          return listing;
        });
        return changed ? updated : prevListings;
      });

      setMatches(prevMatches => {
        let matchChanged = false;
        const updatedMatches = prevMatches.map(match => {
          if (match.status === 'PROPOSED' && match.respondByDeadline) {
            const deadlineMs = new Date(match.respondByDeadline).getTime();
            if (nowMs >= deadlineMs) {
              matchChanged = true;
              return {
                ...match,
                status: 'AUTO_DECLINED' as const,
                respondedAt: new Date(nowMs).toISOString(),
                declineReason: 'Auto-declined — response deadline expired without confirmation.'
              };
            }
          }
          return match;
        });

        if (matchChanged) {
          setListings(prevListings =>
            prevListings.map(listing => {
              const matchedProposal = updatedMatches.find(
                m => m.status === 'AUTO_DECLINED' && m.donorListingId === listing.id
              );
              if (matchedProposal && listing.status === 'PENDING_MATCH') {
                return { ...listing, status: 'ACTIVE' as const };
              }
              return listing;
            })
          );
        }
        return matchChanged ? updatedMatches : prevMatches;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [simulatedTimeOffsetMinutes]);

  // ── Hospital CRUD ────────────────────────────────────────────────

  const registerHospital = useCallback(
    async (data: Partial<Hospital>): Promise<Hospital> => {
      const rawEmail = data.adminContact?.email?.trim();
      const validEmail = rawEmail && rawEmail.includes('@') ? rawEmail : `coord.${Math.floor(1000 + Math.random() * 9000)}@hospital.org`;
      const regNumber = data.licenseNumber?.trim() || `NOTTO-REG-${Math.floor(100000 + Math.random() * 900000)}`;

      // Map frontend shape → backend shape
      const payload = {
        hospital_name: data.name?.trim() || 'New Facility Application',
        registration_number: regNumber,
        city: data.city?.trim() || 'Bengaluru',
        state: data.state?.trim() || 'Karnataka',
        address: data.address?.trim() || 'Medical District',
        pincode: data.pincode?.trim() || '560001',
        contact_email: validEmail,
        contact_phone: data.adminContact?.phone?.trim() || '+91 98000 00000',
        admin_email: validEmail,
        admin_password: (data as any).adminPassword || 'Demo@2024!',
        admin_full_name: data.adminContact?.name?.trim() || 'Chief Transplant Coordinator',
        latitude: 0,
        longitude: 0,
      };

      const result = await apiCall('/hospitals', { method: 'POST', body: JSON.stringify(payload) });

      if (result?.error) {
        showToast({ type: 'warning', title: 'Registration Notice', message: result.error });
        if (result.code === 'CONFLICT') {
          throw new Error(result.error);
        }
      }

      if (result?.data?.hospital) {
        const newHospital = mapHospital(result.data.hospital);
        await fetchHospitals();
        setCurrentHospitalId(newHospital.id);
        setCurrentRole('HOSPITAL_USER');
        showToast({ type: 'info', title: 'Registration Submitted', message: 'Your hospital registration is now under review by NOTTO.' });
        return newHospital;
      }

      // Demo mode fallback
      await new Promise(r => setTimeout(r, 600));
      const newId = 'hosp-' + Math.random().toString(36).substring(2, 9);
      const newHospital: Hospital = {
        id: newId,
        name: data.name || 'New Hospital',
        licenseNumber: data.licenseNumber || `NOTTO-APPL-${Math.floor(1000 + Math.random() * 9000)}`,
        hospitalType: data.hospitalType || 'TRANSPLANT_CENTER',
        address: data.address || 'Medical Enclave',
        city: data.city || 'Bengaluru',
        state: data.state || 'Karnataka',
        pincode: data.pincode || '560001',
        adminContact: data.adminContact || { name: 'Admin', email: 'admin@hospital.org', phone: '+91 98000 00000', designation: 'Director' },
        documents: data.documents || [],
        status: 'PENDING_REVIEW',
      };
      setHospitals(prev => {
        const next = [...prev, newHospital];
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : {};
          parsed.hospitals = next;
          parsed.currentHospitalId = newId;
          parsed.currentRole = 'HOSPITAL_USER';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
        return next;
      });
      setCurrentHospitalId(newId);
      setCurrentRole('HOSPITAL_USER');
      setNotifications(prev => [{ id: 'notif-' + Date.now(), targetRole: 'ADMIN', title: 'New Hospital Registration Pending', message: `${newHospital.name} has submitted an application for accreditation review.`, type: 'REGISTRATION_STATUS', timestamp: new Date().toISOString(), read: false, link: '/admin/queue' }, ...prev]);
      showToast({ type: 'info', title: 'Registration Submitted', message: 'Your application is under review by compliance officers.' });
      return newHospital;
    },
    [fetchHospitals, fetchNotifications, showToast]
  );

  const approveHospital = useCallback(
    async (hospitalId: string) => {
      const token = getToken();
      const targetHospital = hospitals.find(h => h.id === hospitalId);

      if (token) {
        const result = await apiCall(`/hospitals/${hospitalId}/approve`, { method: 'PATCH' });
        if (result) {
          await fetchHospitals();
          await fetchNotifications();
          showToast({ type: 'success', title: 'Hospital Approved', message: `${targetHospital?.name || 'Hospital'} has been verified and granted full access.` });
          return;
        }
      }

      // Demo fallback - update hospitals state and persist directly to localStorage for instant cross-tab sync
      setHospitals(prev => {
        const nextHospitals = prev.map(h => h.id === hospitalId ? { ...h, status: 'VERIFIED' as const, verifiedAt: new Date().toISOString() } : h);
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const parsed = saved ? JSON.parse(saved) : {};
          parsed.hospitals = nextHospitals;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
          console.warn('Failed to sync approved hospital to localStorage', e);
        }
        return nextHospitals;
      });
      showToast({ type: 'success', title: 'Hospital Approved', message: `${targetHospital?.name || 'Hospital'} has been verified.` });
      setNotifications(prev => [{ id: 'notif-' + Date.now(), hospitalId, title: 'Hospital Registration Approved', message: 'Congratulations! Your hospital accreditation is verified.', type: 'REGISTRATION_STATUS', timestamp: new Date().toISOString(), read: false, link: '/dashboard' }, ...prev]);
    },
    [hospitals, fetchHospitals, fetchNotifications, showToast]
  );

  const rejectHospital = useCallback(
    async (hospitalId: string, reason: string) => {
      const token = getToken();
      const targetHospital = hospitals.find(h => h.id === hospitalId);

      if (token) {
        const result = await apiCall(`/hospitals/${hospitalId}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
        if (result) {
          await fetchHospitals();
          await fetchNotifications();
          showToast({ type: 'warning', title: 'Application Rejected', message: `${targetHospital?.name || 'Hospital'} registration was rejected.` });
          return;
        }
      }

      // Demo fallback
      setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, status: 'REJECTED' as const, rejectionReason: reason } : h));
      showToast({ type: 'warning', title: 'Application Rejected', message: `${targetHospital?.name || 'Hospital'} registration was rejected.` });
      setNotifications(prev => [{ id: 'notif-' + Date.now(), hospitalId, title: 'Hospital Registration Not Approved', message: `Your registration could not be approved: ${reason}`, type: 'REGISTRATION_STATUS', timestamp: new Date().toISOString(), read: false, link: '/rejected' }, ...prev]);
    },
    [hospitals, fetchHospitals, fetchNotifications, showToast]
  );

  // ── Listings ─────────────────────────────────────────────────────

  const createListing = useCallback(
    async (data: {
      type: ListingType; organType: OrganType; bloodType: BloodType; hlaTyping: HLATyping;
      donorAge?: number; donorGender?: 'MALE' | 'FEMALE' | 'OTHER'; viabilityHours?: number;
      conditionNotes?: string; donorCauseOfDeath?: string; recipientAge?: number;
      recipientGender?: 'MALE' | 'FEMALE' | 'OTHER'; urgencyLevel?: UrgencyLevel;
      medicalCenterWard?: string; recipientPatientId?: string;
    }): Promise<Listing> => {
      const token = getToken();
      const hosp = hospitals.find(h => h.id === currentHospitalId) || hospitals[0];
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
      const viabilityHrs = data.viabilityHours || MAX_VIABILITY_HOURS[data.organType] || 12;

      if (token) {
        // Backend blood group format: "A+" → "A_POSITIVE"
        const bgRevMap: Record<string, string> = {
          'A+': 'A_POSITIVE', 'A-': 'A_NEGATIVE', 'B+': 'B_POSITIVE', 'B-': 'B_NEGATIVE',
          'AB+': 'AB_POSITIVE', 'AB-': 'AB_NEGATIVE', 'O+': 'O_POSITIVE', 'O-': 'O_NEGATIVE',
        };
        const urgencyRevMap: Record<string, string> = {
          '1A_CRITICAL': 'CRITICAL', '1B_URGENT': 'HIGH', '2_STANDARD': 'MEDIUM',
        };

        if (data.type === 'DONOR') {
          const payload = {
            organ_type: data.organType.toUpperCase(),
            blood_group: bgRevMap[data.bloodType] || data.bloodType,
            hla_typing: data.hlaTyping,
            cold_ischemia_hours: viabilityHrs,
            donor_age: data.donorAge,
            donor_gender: data.donorGender,
            notes: data.conditionNotes,
            cause_of_death: data.donorCauseOfDeath,
          };
          const result = await apiCall('/organs', { method: 'POST', body: JSON.stringify(payload) });
          if (result?.data) {
            await fetchListings(hospitals);
            const newListing = mapOrgan(result.data, hosp.name, hosp.city);
            showToast({ type: 'success', title: 'Donor Organ Listing Created', message: `${data.organType} (${data.bloodType}) is now live in the matching pool.`, link: `/listings/${newListing.id}/matches` });
            return newListing;
          }
        } else {
          const payload = {
            organ_needed: data.organType.toUpperCase(),
            blood_group: bgRevMap[data.bloodType] || data.bloodType,
            hla_typing: data.hlaTyping,
            urgency_level: urgencyRevMap[data.urgencyLevel || '2_STANDARD'] || 'MEDIUM',
            patient_ref: data.recipientPatientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
            age: data.recipientAge,
            gender: data.recipientGender,
            ward: data.medicalCenterWard,
          };
          const result = await apiCall('/recipients', { method: 'POST', body: JSON.stringify(payload) });
          if (result?.data) {
            await fetchListings(hospitals);
            const newListing = mapRecipient(result.data, hosp.name, hosp.city);
            showToast({ type: 'success', title: 'Recipient Listing Created', message: `${data.organType} (${data.bloodType}) patient is now on the waiting list.`, link: `/listings/${newListing.id}/matches` });
            return newListing;
          }
        }
      }

      // Demo fallback
      await new Promise(r => setTimeout(r, 450));
      const newId = `L-${data.type}-${Math.floor(100 + Math.random() * 900)}`;
      const viabilityDeadline = data.type === 'DONOR' ? new Date(nowTime + viabilityHrs * 3600 * 1000).toISOString() : undefined;
      const newListing: Listing = {
        id: newId, hospitalId: hosp.id, hospitalName: hosp.name, hospitalCity: hosp.city,
        type: data.type, organType: data.organType, bloodType: data.bloodType, hlaTyping: data.hlaTyping,
        status: 'ACTIVE', createdAt: new Date(nowTime).toISOString(),
        donorAge: data.donorAge, donorGender: data.donorGender, viabilityDeadline,
        initialViabilityHours: viabilityHrs, coldIschemiaMaxHours: viabilityHrs,
        conditionNotes: data.conditionNotes, donorCauseOfDeath: data.donorCauseOfDeath,
        recipientAge: data.recipientAge, recipientGender: data.recipientGender,
        urgencyLevel: data.urgencyLevel || '1B_URGENT', waitingSince: data.type === 'RECIPIENT' ? new Date(nowTime).toISOString() : undefined,
        medicalCenterWard: data.medicalCenterWard, recipientPatientId: data.recipientPatientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      setListings(prev => [newListing, ...prev]);
      showToast({ type: 'success', title: `${data.type === 'DONOR' ? 'Donor Organ' : 'Recipient'} Listing Created`, message: `${data.organType} (${data.bloodType}) is now live in the matching pool.`, link: `/listings/${newListing.id}/matches` });
      return newListing;
    },
    [hospitals, currentHospitalId, simulatedTimeOffsetMinutes, fetchListings, showToast]
  );

  const getListingById = useCallback((id: string) => listings.find(l => l.id === id), [listings]);

  // ── Match workflow ───────────────────────────────────────────────

  const proposeMatch = useCallback(
    async (donorListingId: string, recipientListingId: string): Promise<Match> => {
      const token = getToken();
      const donor = listings.find(l => l.id === donorListingId);
      const recipient = listings.find(l => l.id === recipientListingId);
      if (!donor || !recipient) throw new Error('Donor or Recipient listing not found');

      const distance = calculateDistance(donor.hospitalId, recipient.hospitalId);
      const travelTimeMin = estimateTransitTimeMinutes(distance);
      const hlaScore = calculateHLAScore(donor.hlaTyping, recipient.hlaTyping);
      const compositeScore = Math.min(99, Math.round(hlaScore * 0.4 + 55));
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
      const deadline = new Date(nowTime + 45 * 60 * 1000).toISOString();

      if (token) {
        const result = await apiCall('/matches/propose', {
          method: 'POST',
          body: JSON.stringify({ organ_id: donorListingId, recipient_id: recipientListingId }),
        });
        if (result?.data) {
          const newMatch = mapMatch(result.data, listings);
          if (newMatch) {
            await fetchListings(hospitals);
            await fetchNotifications();
            setMatches(prev => [newMatch, ...prev]);
            showToast({ type: 'success', title: 'Match Proposed Successfully', message: `Request transmitted to ${recipient.hospitalName}.` });
            return newMatch;
          }
        }
      }

      // Demo fallback
      await new Promise(r => setTimeout(r, 500));
      const newMatch: Match = {
        id: `MATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        donorListingId: donor.id, recipientListingId: recipient.id,
        donorListing: donor, recipientListing: recipient,
        proposingHospitalId: donor.hospitalId, receivingHospitalId: recipient.hospitalId,
        proposingHospitalName: donor.hospitalName, receivingHospitalName: recipient.hospitalName,
        compatibilityScore: compositeScore, distanceKm: distance, travelTimeMinutes: travelTimeMin,
        breakdown: { bloodGroup: 100, hlaScore, distanceScore: Math.max(50, Math.round(100 - (distance / 600) * 50)), urgencyScore: 100, viabilityFeasible: true },
        status: 'PROPOSED', proposedAt: new Date(nowTime).toISOString(), respondByDeadline: deadline,
        activeLockedListingIds: [donor.id, recipient.id],
      };
      setListings(prev => prev.map(l => l.id === donor.id || l.id === recipient.id ? { ...l, status: 'PENDING_MATCH' as const } : l));
      setMatches(prev => [newMatch, ...prev]);
      setNotifications(prev => [{ id: 'notif-' + Date.now(), hospitalId: recipient.hospitalId, title: `URGENT: Incoming Match Proposal - ${donor.organType} (${donor.bloodType})`, message: `${donor.hospitalName} has proposed an organ match. 45m response window.`, type: 'PROPOSAL_RECEIVED', timestamp: new Date(nowTime).toISOString(), read: false, link: '/requests', isUrgent: true }, ...prev]);
      showToast({ type: 'success', title: 'Match Proposed Successfully', message: `Request transmitted to ${recipient.hospitalName}.` });
      return newMatch;
    },
    [listings, hospitals, simulatedTimeOffsetMinutes, fetchListings, fetchNotifications, showToast]
  );

  const confirmMatch = useCallback(
    async (matchId: string) => {
      const token = getToken();
      const targetMatch = matches.find(m => m.id === matchId);
      if (!targetMatch) return;
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      if (token) {
        const result = await apiCall(`/matches/${matchId}/accept`, { method: 'PATCH' });
        if (result) {
          await fetchListings(hospitals);
          await fetchMatches(listings);
          await fetchNotifications();
          showToast({ type: 'success', title: 'Match Confirmed!', message: 'Protocol handoff initiated. Organ transport is now tracking in real time.', link: `/transport/${matchId}` });
          return;
        }
      }

      // Demo fallback
      await new Promise(r => setTimeout(r, 600));
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'CONFIRMED' as const, respondedAt: new Date(nowTime).toISOString() } : m));
      setListings(prev => prev.map(l => l.id === targetMatch.donorListingId || l.id === targetMatch.recipientListingId ? { ...l, status: 'MATCHED' as const } : l));
      const existingTransport = transports.find(t => t.matchId === matchId);
      if (!existingTransport) {
        const newTransport: Transport = {
          matchId, match: targetMatch, status: 'PENDING',
          preservationBoxId: `LIFELINK-BOX-${Math.floor(100 + Math.random() * 900)}`,
          currentTemperature: 3.6, targetTempMin: 2.0, targetTempMax: 6.0, batteryLevel: 95, gpsSpeedKmH: 0,
          originHospital: targetMatch.proposingHospitalName, destinationHospital: targetMatch.receivingHospitalName,
          etaMinutes: targetMatch.travelTimeMinutes, transportVehicle: 'GREEN_CORRIDOR_AMBULANCE',
          trackingNumber: `LL-TRK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          driverContact: { name: 'Captain Rajesh V. (Emergency Logistics)', phone: '+91 99887 66554' },
          checkpoints: [
            { title: 'Organ Retrieval & Cross-Clamp Sign-off', completed: true, location: `${targetMatch.proposingHospitalName} Surgical Suite`, timestamp: new Date(nowTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { title: 'Cold Preservation Box Sealed & QA Verified', completed: true, location: 'Ambulance Departure Bay' },
            { title: 'Green Corridor Tollway Transit', completed: false, location: 'Expressway Air/Ground Route' },
            { title: 'Recipient OT Handoff & Surgery Prep', completed: false, location: targetMatch.receivingHospitalName },
          ],
        };
        setTransports(prev => [newTransport, ...prev]);
      }
      setNotifications(prev => [
        { id: 'notif-conf-1-' + Date.now(), hospitalId: targetMatch.proposingHospitalId, title: `Match Confirmed: ${targetMatch.donorListing.organType}`, message: `${targetMatch.receivingHospitalName} has confirmed the match! Prepare organ dispatch.`, type: 'MATCH_CONFIRMED', timestamp: new Date(nowTime).toISOString(), read: false, link: `/transport/${matchId}`, isUrgent: true },
        { id: 'notif-conf-2-' + Date.now(), hospitalId: targetMatch.receivingHospitalId, title: `Match Confirmed: ${targetMatch.donorListing.organType}`, message: `Match confirmed. Transport tracking initialized.`, type: 'MATCH_CONFIRMED', timestamp: new Date(nowTime).toISOString(), read: false, link: `/transport/${matchId}`, isUrgent: true },
        ...prev,
      ]);
      showToast({ type: 'success', title: 'Match Confirmed!', message: 'Protocol handoff initiated.', link: `/transport/${matchId}` });
    },
    [matches, transports, hospitals, listings, simulatedTimeOffsetMinutes, fetchListings, fetchMatches, fetchNotifications, showToast]
  );

  const declineMatch = useCallback(
    async (matchId: string, reason?: string) => {
      const token = getToken();
      const targetMatch = matches.find(m => m.id === matchId);
      if (!targetMatch) return;
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      if (token) {
        const result = await apiCall(`/matches/${matchId}/reject`, { method: 'PATCH', body: JSON.stringify({ reason: reason || 'Declined by recipient hospital.' }) });
        if (result) {
          await fetchListings(hospitals);
          await fetchMatches(listings);
          await fetchNotifications();
          showToast({ type: 'info', title: 'Match Proposal Declined', message: 'The proposal was closed and the donor listing has reverted to ACTIVE.' });
          return;
        }
      }

      // Demo fallback
      await new Promise(r => setTimeout(r, 400));
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'DECLINED' as const, respondedAt: new Date(nowTime).toISOString(), declineReason: reason || 'Recipient team declined.' } : m));
      setListings(prev => prev.map(l => l.id === targetMatch.donorListingId || l.id === targetMatch.recipientListingId ? { ...l, status: 'ACTIVE' as const } : l));
      setNotifications(prev => [{ id: 'notif-dec-' + Date.now(), hospitalId: targetMatch.proposingHospitalId, title: `Proposal Declined: ${targetMatch.donorListing.organType}`, message: `${targetMatch.receivingHospitalName} declined the match. Listing unlocked.`, type: 'MATCH_DECLINED', timestamp: new Date(nowTime).toISOString(), read: false, link: `/listings/${targetMatch.donorListingId}/matches` }, ...prev]);
      showToast({ type: 'info', title: 'Match Proposal Declined', message: 'The proposal was closed and the donor listing has reverted to ACTIVE.' });
    },
    [matches, hospitals, listings, simulatedTimeOffsetMinutes, fetchListings, fetchMatches, fetchNotifications, showToast]
  );

  // ── Transport ────────────────────────────────────────────────────

  const advanceTransportStatus = useCallback(
    async (matchId: string, nextStatus: TransportStatus) => {
      const token = getToken();
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      const statusApiMap: Record<TransportStatus, string> = {
        PENDING: 'PENDING', DISPATCHED: 'DISPATCHED', IN_TRANSIT: 'IN_TRANSIT', DELIVERED: 'DELIVERED',
      };

      if (token) {
        const result = await apiCall(`/transports/${matchId}`, { method: 'PATCH', body: JSON.stringify({ status: statusApiMap[nextStatus] }) });
        if (result) {
          await fetchMatches(listings);
          if (nextStatus === 'DELIVERED') {
            showToast({ type: 'success', title: 'Organ Successfully Delivered!', message: 'Delivery signed off. Match record has closed as COMPLETED in history.', link: '/history' });
          } else {
            showToast({ type: 'info', title: `Transport Status: ${nextStatus.replace('_', ' ')}`, message: 'Logistics milestone recorded.' });
          }
          return;
        }
      }

      // Demo fallback
      setTransports(prev => prev.map(t => {
        if (t.matchId !== matchId) return t;
        const updated = { ...t, status: nextStatus };
        if (nextStatus === 'DISPATCHED') { updated.dispatchedAt = new Date(nowTime).toISOString(); updated.gpsSpeedKmH = 65; updated.checkpoints[1].completed = true; }
        else if (nextStatus === 'IN_TRANSIT') { updated.inTransitAt = new Date(nowTime).toISOString(); updated.gpsSpeedKmH = 80; updated.checkpoints[2].completed = true; }
        else if (nextStatus === 'DELIVERED') { updated.deliveredAt = new Date(nowTime).toISOString(); updated.gpsSpeedKmH = 0; updated.etaMinutes = 0; updated.checkpoints.forEach(c => (c.completed = true)); }
        return updated;
      }));
      if (nextStatus === 'DELIVERED') {
        setMatches(prev => prev.map(m => (m.id === matchId ? { ...m, status: 'COMPLETED' as const } : m)));
        const targetMatch = matches.find(m => m.id === matchId);
        if (targetMatch) setListings(prev => prev.map(l => l.id === targetMatch.donorListingId || l.id === targetMatch.recipientListingId ? { ...l, status: 'COMPLETED' as const } : l));
        showToast({ type: 'success', title: 'Organ Successfully Delivered!', message: 'Delivery signed off. Match record has closed as COMPLETED in history.', link: '/history' });
      } else {
        showToast({ type: 'info', title: `Transport Status: ${nextStatus.replace('_', ' ')}`, message: 'Logistics milestone recorded.' });
      }
    },
    [matches, listings, simulatedTimeOffsetMinutes, fetchMatches, showToast]
  );

  const getTransportByMatchId = useCallback((matchId: string) => transports.find(t => t.matchId === matchId), [transports]);

  // ── Simulation helpers ──────────────────────────────────────────

  const simulateAdvanceTime = useCallback((minutes: number) => {
    setSimulatedTimeOffsetMinutes(prev => prev + minutes);
  }, []);

  const simulateIncomingMatchProposal = useCallback(() => {
    const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
    const simMatch: Match = {
      id: `MATCH-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      donorListingId: 'L-DONOR-882', recipientListingId: 'L-REC-STJ-101',
      donorListing: SEED_LISTINGS[0], recipientListing: SEED_LISTINGS[6],
      proposingHospitalId: 'hosp-metro-gen', receivingHospitalId: 'hosp-st-jude',
      proposingHospitalName: 'Metro General Hospital & Trauma Center', receivingHospitalName: 'St. Jude Heart & Lung Institute',
      compatibilityScore: 99, distanceKm: 310, travelTimeMinutes: 55,
      breakdown: { bloodGroup: 100, hlaScore: 98, distanceScore: 85, urgencyScore: 100, viabilityFeasible: true },
      status: 'PROPOSED', proposedAt: new Date(nowTime).toISOString(), respondByDeadline: new Date(nowTime + 45 * 60 * 1000).toISOString(),
      activeLockedListingIds: ['L-DONOR-882', 'L-REC-STJ-101'],
    };
    setMatches(prev => [simMatch, ...prev]);
    setNotifications(prev => [{ id: 'notif-sim-' + Date.now(), hospitalId: 'hosp-st-jude', title: 'URGENT: Donor Heart Match Proposed (O+)', message: 'Metro General Hospital proposed Heart for Patient PT-STJ-9941. 45m response countdown.', type: 'PROPOSAL_RECEIVED', timestamp: new Date(nowTime).toISOString(), read: false, link: '/requests', isUrgent: true }, ...prev]);
    showToast({ type: 'warning', title: 'Incoming Proposal Simulated!', message: 'Switch to St. Jude or view /requests to test the response countdown.', link: '/requests' });
  }, [simulatedTimeOffsetMinutes, showToast]);

  const simulateTriggerViabilityAlert = useCallback(() => {
    showToast({ type: 'error', title: 'Viability Alert Simulated', message: 'Cold ischemia window critical (< 30 min remaining) on active listing #H-882.', link: '/listings' });
  }, [showToast]);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHospitals(SEED_HOSPITALS);
    setListings(SEED_LISTINGS);
    setMatches(SEED_MATCHES);
    setTransports(SEED_TRANSPORTS);
    setNotifications(SEED_NOTIFICATIONS);
    setCurrentRole('HOSPITAL_USER');
    setCurrentHospitalId('hosp-metro-gen');
    setSimulatedTimeOffsetMinutes(0);
    showToast({ type: 'info', title: 'Platform Reset', message: 'All mock hospitals, listings, matches and transports restored to clean seed state.' });
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem(JWT_KEY);
    setCurrentRole('HOSPITAL_USER');
    setCurrentHospitalId('');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  // ── Context value ───────────────────────────────────────────────

  const value = useMemo(
    () => ({
      currentRole, currentHospitalId, currentHospital, setCurrentRole, setCurrentHospitalId,
      hospitals, registerHospital, approveHospital, rejectHospital,
      listings, createListing, getListingById,
      matches, proposeMatch, confirmMatch, declineMatch,
      transports, getTransportByMatchId, advanceTransportStatus,
      notifications, markNotificationRead, markAllNotificationsRead,
      toasts, dismissToast, showToast,
      simulateIncomingMatchProposal, simulateAdvanceTime, simulateTriggerViabilityAlert,
      resetAllData, simulatedTimeOffsetMinutes, logout, isLoaded,
    }),
    [
      currentRole, currentHospitalId, currentHospital, hospitals, registerHospital, approveHospital, rejectHospital,
      listings, createListing, getListingById, matches, proposeMatch, confirmMatch, declineMatch,
      transports, getTransportByMatchId, advanceTransportStatus, notifications, markNotificationRead, markAllNotificationsRead,
      toasts, dismissToast, showToast, simulateIncomingMatchProposal, simulateAdvanceTime, simulateTriggerViabilityAlert,
      resetAllData, simulatedTimeOffsetMinutes, logout, isLoaded,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform must be used within a PlatformProvider');
  return context;
}
