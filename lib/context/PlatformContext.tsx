'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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

interface ToastAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  link?: string;
  duration?: number;
}

interface PlatformContextType {
  // Authentication & Hospital Profile
  currentRole: UserRole;
  currentHospitalId: string;
  currentHospital: Hospital | null;
  setCurrentRole: (role: UserRole) => void;
  setCurrentHospitalId: (hospId: string) => void;
  hospitals: Hospital[];

  // Onboarding & Admin
  registerHospital: (data: Partial<Hospital>) => Promise<Hospital>;
  approveHospital: (hospitalId: string) => void;
  rejectHospital: (hospitalId: string, reason: string) => void;

  // Listings
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

  // Matching
  matches: Match[];
  proposeMatch: (donorListingId: string, recipientListingId: string) => Promise<Match>;
  confirmMatch: (matchId: string) => Promise<void>;
  declineMatch: (matchId: string, reason?: string) => Promise<void>;

  // Transport
  transports: Transport[];
  getTransportByMatchId: (matchId: string) => Transport | undefined;
  advanceTransportStatus: (matchId: string, nextStatus: TransportStatus) => void;

  // Notifications & Toast
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  showToast: (toast: Omit<ToastAlert, 'id'>) => void;

  // Simulation Controls for Hackathon / Demos
  simulateIncomingMatchProposal: () => void;
  simulateAdvanceTime: (minutes: number) => void;
  simulateTriggerViabilityAlert: () => void;
  resetAllData: () => void;
  simulatedTimeOffsetMinutes: number;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const STORAGE_KEY = 'lifelink_platform_state_v1';

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('HOSPITAL_USER');
  const [currentHospitalId, setCurrentHospitalId] = useState<string>('hosp-metro-gen');
  const [hospitals, setHospitals] = useState<Hospital[]>(SEED_HOSPITALS);
  const [listings, setListings] = useState<Listing[]>(SEED_LISTINGS);
  const [matches, setMatches] = useState<Match[]>(SEED_MATCHES);
  const [transports, setTransports] = useState<Transport[]>(SEED_TRANSPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [simulatedTimeOffsetMinutes, setSimulatedTimeOffsetMinutes] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.hospitals) setHospitals(parsed.hospitals);
        if (parsed.listings) setListings(parsed.listings);
        if (parsed.matches) setMatches(parsed.matches);
        if (parsed.transports) setTransports(parsed.transports);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
        if (parsed.currentHospitalId) setCurrentHospitalId(parsed.currentHospitalId);
        if (parsed.simulatedTimeOffsetMinutes) setSimulatedTimeOffsetMinutes(parsed.simulatedTimeOffsetMinutes);
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          hospitals,
          listings,
          matches,
          transports,
          notifications,
          currentRole,
          currentHospitalId,
          simulatedTimeOffsetMinutes
        })
      );
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [hospitals, listings, matches, transports, notifications, currentRole, currentHospitalId, simulatedTimeOffsetMinutes, isLoaded]);

  const currentHospital = useMemo(() => {
    return hospitals.find(h => h.id === currentHospitalId) || null;
  }, [hospitals, currentHospitalId]);

  const showToast = useCallback((toast: Omit<ToastAlert, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);

    const duration = toast.duration || 6000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Check viability deadlines and auto-decline timeouts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMs = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      // 1. Check for expired donor listings
      setListings(prevListings => {
        let changed = false;
        const updated = prevListings.map(listing => {
          if (
            listing.type === 'DONOR' &&
            listing.status === 'ACTIVE' &&
            listing.viabilityDeadline
          ) {
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

      // 2. Check for proposed matches past response deadline -> Auto Decline
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
          // Unlock donor listings associated with auto-declined matches
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

  // Register New Hospital
  const registerHospital = useCallback(
    async (data: Partial<Hospital>): Promise<Hospital> => {
      // Simulate artificial network latency
      await new Promise(r => setTimeout(r, 600));

      const newId = 'hosp-' + Math.random().toString(36).substring(2, 9);
      const newHospital: Hospital = {
        id: newId,
        name: data.name || 'New Registered Hospital',
        licenseNumber: data.licenseNumber || `NOTTO-APPL-${Math.floor(1000 + Math.random() * 9000)}`,
        hospitalType: data.hospitalType || 'TRANSPLANT_CENTER',
        address: data.address || 'Medical Enclave',
        city: data.city || 'Bengaluru',
        state: data.state || 'Karnataka',
        pincode: data.pincode || '560001',
        adminContact: data.adminContact || {
          name: 'Hospital Administrator',
          email: 'admin@hospital.org',
          phone: '+91 98000 00000',
          designation: 'Medical Director'
        },
        documents: data.documents || [
          {
            id: 'doc-upload-1',
            name: 'Hospital_Registration_Certificate.pdf',
            type: 'application/pdf',
            size: '2.1 MB',
            uploadedAt: new Date().toISOString()
          }
        ],
        status: 'PENDING_REVIEW'
      };

      setHospitals(prev => [...prev, newHospital]);
      setCurrentHospitalId(newId);
      setCurrentRole('HOSPITAL_USER');

      // Add admin notification
      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          targetRole: 'ADMIN',
          title: 'New Hospital Registration Pending',
          message: `${newHospital.name} has submitted an application for NOTTO accreditation.`,
          type: 'REGISTRATION_STATUS',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/admin/queue'
        },
        ...prev
      ]);

      showToast({
        type: 'info',
        title: 'Registration Submitted',
        message: 'Your hospital registration is now under review by the NOTTO admin team.'
      });

      return newHospital;
    },
    [showToast]
  );

  // Admin Approve Hospital
  const approveHospital = useCallback(
    (hospitalId: string) => {
      setHospitals(prev =>
        prev.map(h =>
          h.id === hospitalId
            ? { ...h, status: 'VERIFIED' as const, verifiedAt: new Date().toISOString() }
            : h
        )
      );

      const targetHospital = hospitals.find(h => h.id === hospitalId);
      showToast({
        type: 'success',
        title: 'Hospital Approved',
        message: `${targetHospital?.name || 'Hospital'} has been verified and granted full access.`
      });

      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          hospitalId,
          title: 'Hospital Registration Approved',
          message: 'Congratulations! Your hospital accreditation is verified. You now have full operational access to LifeLink.',
          type: 'REGISTRATION_STATUS',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/dashboard'
        },
        ...prev
      ]);
    },
    [hospitals, showToast]
  );

  // Admin Reject Hospital
  const rejectHospital = useCallback(
    (hospitalId: string, reason: string) => {
      setHospitals(prev =>
        prev.map(h =>
          h.id === hospitalId
            ? { ...h, status: 'REJECTED' as const, rejectionReason: reason }
            : h
        )
      );

      const targetHospital = hospitals.find(h => h.id === hospitalId);
      showToast({
        type: 'warning',
        title: 'Application Rejected',
        message: `${targetHospital?.name || 'Hospital'} registration was rejected.`
      });

      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          hospitalId,
          title: 'Hospital Registration Not Approved',
          message: `Your registration could not be approved: ${reason}`,
          type: 'REGISTRATION_STATUS',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/rejected'
        },
        ...prev
      ]);
    },
    [hospitals, showToast]
  );

  // Create Listing
  const createListing = useCallback(
    async (data: {
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
    }): Promise<Listing> => {
      await new Promise(r => setTimeout(r, 450)); // realistic latency

      const hosp = currentHospital || SEED_HOSPITALS[0];
      const newId = `L-${data.type}-${Math.floor(100 + Math.random() * 900)}`;

      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
      const viabilityHrs = data.viabilityHours || MAX_VIABILITY_HOURS[data.organType] || 12;
      const viabilityDeadline =
        data.type === 'DONOR'
          ? new Date(nowTime + viabilityHrs * 3600 * 1000).toISOString()
          : undefined;

      const newListing: Listing = {
        id: newId,
        hospitalId: hosp.id,
        hospitalName: hosp.name,
        hospitalCity: hosp.city,
        type: data.type,
        organType: data.organType,
        bloodType: data.bloodType,
        hlaTyping: data.hlaTyping,
        status: 'ACTIVE',
        createdAt: new Date(nowTime).toISOString(),

        donorAge: data.donorAge,
        donorGender: data.donorGender,
        viabilityDeadline,
        initialViabilityHours: viabilityHrs,
        coldIschemiaMaxHours: viabilityHrs,
        conditionNotes: data.conditionNotes,
        donorCauseOfDeath: data.donorCauseOfDeath,

        recipientAge: data.recipientAge,
        recipientGender: data.recipientGender,
        urgencyLevel: data.urgencyLevel || '1B_URGENT',
        waitingSince: data.type === 'RECIPIENT' ? new Date(nowTime).toISOString() : undefined,
        medicalCenterWard: data.medicalCenterWard,
        recipientPatientId: data.recipientPatientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`
      };

      setListings(prev => [newListing, ...prev]);

      showToast({
        type: 'success',
        title: `${data.type === 'DONOR' ? 'Donor Organ' : 'Recipient'} Listing Created`,
        message: `${data.organType} (${data.bloodType}) is now live in the matching pool.`,
        link: `/listings/${newListing.id}/matches`
      });

      return newListing;
    },
    [currentHospital, simulatedTimeOffsetMinutes, showToast]
  );

  const getListingById = useCallback(
    (id: string) => {
      return listings.find(l => l.id === id);
    },
    [listings]
  );

  // Propose Match
  const proposeMatch = useCallback(
    async (donorListingId: string, recipientListingId: string): Promise<Match> => {
      await new Promise(r => setTimeout(r, 500));

      const donor = listings.find(l => l.id === donorListingId);
      const recipient = listings.find(l => l.id === recipientListingId);

      if (!donor || !recipient) {
        throw new Error('Donor or Recipient listing not found');
      }

      const distance = calculateDistance(donor.hospitalId, recipient.hospitalId);
      const travelTimeMin = estimateTransitTimeMinutes(distance);
      const hlaScore = calculateHLAScore(donor.hlaTyping, recipient.hlaTyping);
      const compositeScore = Math.min(99, Math.round(hlaScore * 0.4 + 20 + 25 + 10));

      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
      // 45 minute response deadline for critical organ
      const deadline = new Date(nowTime + 45 * 60 * 1000).toISOString();

      const newMatch: Match = {
        id: `MATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        donorListingId: donor.id,
        recipientListingId: recipient.id,
        donorListing: donor,
        recipientListing: recipient,
        proposingHospitalId: donor.hospitalId,
        receivingHospitalId: recipient.hospitalId,
        proposingHospitalName: donor.hospitalName,
        receivingHospitalName: recipient.hospitalName,
        compatibilityScore: compositeScore,
        distanceKm: distance,
        travelTimeMinutes: travelTimeMin,
        breakdown: {
          bloodGroup: 100,
          hlaScore,
          distanceScore: Math.max(50, Math.round(100 - (distance / 600) * 50)),
          urgencyScore: 100,
          viabilityFeasible: true
        },
        status: 'PROPOSED',
        proposedAt: new Date(nowTime).toISOString(),
        respondByDeadline: deadline,
        activeLockedListingIds: [donor.id, recipient.id]
      };

      // Flip listings to PENDING_MATCH (locked state)
      setListings(prev =>
        prev.map(l =>
          l.id === donor.id || l.id === recipient.id
            ? { ...l, status: 'PENDING_MATCH' as const }
            : l
        )
      );

      setMatches(prev => [newMatch, ...prev]);

      // Emit notifications
      setNotifications(prev => [
        {
          id: 'notif-' + Date.now(),
          hospitalId: recipient.hospitalId,
          title: `URGENT: Incoming Match Proposal - ${donor.organType} (${donor.bloodType})`,
          message: `${donor.hospitalName} has proposed an organ match. 45m response window remaining.`,
          type: 'PROPOSAL_RECEIVED',
          timestamp: new Date(nowTime).toISOString(),
          read: false,
          link: '/requests',
          isUrgent: true
        },
        ...prev
      ]);

      showToast({
        type: 'success',
        title: 'Match Proposed Successfully',
        message: `Listing is now locked (PENDING_MATCH). Request transmitted to ${recipient.hospitalName}.`
      });

      return newMatch;
    },
    [listings, simulatedTimeOffsetMinutes, showToast]
  );

  // Confirm Match (Accept Proposal)
  const confirmMatch = useCallback(
    async (matchId: string) => {
      await new Promise(r => setTimeout(r, 600));

      const targetMatch = matches.find(m => m.id === matchId);
      if (!targetMatch) return;

      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      // 1. Update match to CONFIRMED
      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? {
                ...m,
                status: 'CONFIRMED' as const,
                respondedAt: new Date(nowTime).toISOString()
              }
            : m
        )
      );

      // 2. Update both listings to MATCHED
      setListings(prev =>
        prev.map(l =>
          l.id === targetMatch.donorListingId || l.id === targetMatch.recipientListingId
            ? { ...l, status: 'MATCHED' as const }
            : l
        )
      );

      // 3. Initialize Transport record
      const existingTransport = transports.find(t => t.matchId === matchId);
      if (!existingTransport) {
        const newTransport: Transport = {
          matchId,
          match: targetMatch,
          status: 'PENDING',
          preservationBoxId: `LIFELINK-BOX-${Math.floor(100 + Math.random() * 900)}`,
          currentTemperature: 3.6,
          targetTempMin: 2.0,
          targetTempMax: 6.0,
          batteryLevel: 95,
          gpsSpeedKmH: 0,
          originHospital: targetMatch.proposingHospitalName,
          destinationHospital: targetMatch.receivingHospitalName,
          etaMinutes: targetMatch.travelTimeMinutes,
          transportVehicle: 'GREEN_CORRIDOR_AMBULANCE',
          trackingNumber: `LL-TRK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          driverContact: {
            name: 'Captain Rajesh V. (Emergency Logistics)',
            phone: '+91 99887 66554'
          },
          checkpoints: [
            {
              title: 'Organ Retrieval & Cross-Clamp Sign-off',
              completed: true,
              location: `${targetMatch.proposingHospitalName} Surgical Suite`,
              timestamp: new Date(nowTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            {
              title: 'Cold Preservation Box Sealed & QA Verified',
              completed: true,
              location: 'Ambulance Departure Bay'
            },
            {
              title: 'Green Corridor Tollway Transit',
              completed: false,
              location: 'Expressway Air/Ground Route'
            },
            {
              title: 'Recipient OT Handoff & Surgery Prep',
              completed: false,
              location: targetMatch.receivingHospitalName
            }
          ]
        };
        setTransports(prev => [newTransport, ...prev]);
      }

      // 4. Send dual notifications
      setNotifications(prev => [
        {
          id: 'notif-conf-1-' + Date.now(),
          hospitalId: targetMatch.proposingHospitalId,
          title: `Match Confirmed: ${targetMatch.donorListing.organType}`,
          message: `${targetMatch.receivingHospitalName} has confirmed the match! Prepare organ dispatch.`,
          type: 'MATCH_CONFIRMED',
          timestamp: new Date(nowTime).toISOString(),
          read: false,
          link: `/transport/${matchId}`,
          isUrgent: true
        },
        {
          id: 'notif-conf-2-' + Date.now(),
          hospitalId: targetMatch.receivingHospitalId,
          title: `Match Confirmed: ${targetMatch.donorListing.organType}`,
          message: `Match confirmed for Patient ${targetMatch.recipientListing.recipientPatientId}. Transport tracking initialized.`,
          type: 'MATCH_CONFIRMED',
          timestamp: new Date(nowTime).toISOString(),
          read: false,
          link: `/transport/${matchId}`,
          isUrgent: true
        },
        ...prev
      ]);

      showToast({
        type: 'success',
        title: 'Match Confirmed!',
        message: 'Protocol handoff initiated. Organ transport is now tracking in real time.',
        link: `/transport/${matchId}`
      });
    },
    [matches, transports, simulatedTimeOffsetMinutes, showToast]
  );

  // Decline Match
  const declineMatch = useCallback(
    async (matchId: string, reason?: string) => {
      await new Promise(r => setTimeout(r, 400));

      const targetMatch = matches.find(m => m.id === matchId);
      if (!targetMatch) return;

      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      // Update match to DECLINED
      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? {
                ...m,
                status: 'DECLINED' as const,
                respondedAt: new Date(nowTime).toISOString(),
                declineReason: reason || 'Recipient team declined (unfavorable bedside clinical parameter).'
              }
            : m
        )
      );

      // Revert donor listing to ACTIVE (unlocked)
      setListings(prev =>
        prev.map(l => {
          if (l.id === targetMatch.donorListingId) {
            return { ...l, status: 'ACTIVE' as const };
          }
          if (l.id === targetMatch.recipientListingId) {
            return { ...l, status: 'ACTIVE' as const };
          }
          return l;
        })
      );

      // Notify proposing hospital
      setNotifications(prev => [
        {
          id: 'notif-dec-' + Date.now(),
          hospitalId: targetMatch.proposingHospitalId,
          title: `Proposal Declined: ${targetMatch.donorListing.organType}`,
          message: `${targetMatch.receivingHospitalName} declined the match. Listing unlocked to ACTIVE. Review next candidate.`,
          type: 'MATCH_DECLINED',
          timestamp: new Date(nowTime).toISOString(),
          read: false,
          link: `/listings/${targetMatch.donorListingId}/matches`
        },
        ...prev
      ]);

      showToast({
        type: 'info',
        title: 'Match Proposal Declined',
        message: 'The proposal was closed and the donor listing has reverted to ACTIVE.'
      });
    },
    [matches, simulatedTimeOffsetMinutes, showToast]
  );

  // Advance Transport Stepper
  const advanceTransportStatus = useCallback(
    (matchId: string, nextStatus: TransportStatus) => {
      const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;

      setTransports(prev =>
        prev.map(t => {
          if (t.matchId !== matchId) return t;

          const updated = { ...t, status: nextStatus };
          if (nextStatus === 'DISPATCHED') {
            updated.dispatchedAt = new Date(nowTime).toISOString();
            updated.gpsSpeedKmH = 65;
            updated.checkpoints[1].completed = true;
          } else if (nextStatus === 'IN_TRANSIT') {
            updated.inTransitAt = new Date(nowTime).toISOString();
            updated.gpsSpeedKmH = 80;
            updated.checkpoints[2].completed = true;
          } else if (nextStatus === 'DELIVERED') {
            updated.deliveredAt = new Date(nowTime).toISOString();
            updated.gpsSpeedKmH = 0;
            updated.etaMinutes = 0;
            updated.checkpoints.forEach(c => (c.completed = true));
          }
          return updated;
        })
      );

      // If delivered, mark match as COMPLETED and listings as COMPLETED
      if (nextStatus === 'DELIVERED') {
        setMatches(prev =>
          prev.map(m => (m.id === matchId ? { ...m, status: 'COMPLETED' as const } : m))
        );

        const targetMatch = matches.find(m => m.id === matchId);
        if (targetMatch) {
          setListings(prev =>
            prev.map(l =>
              l.id === targetMatch.donorListingId || l.id === targetMatch.recipientListingId
                ? { ...l, status: 'COMPLETED' as const }
                : l
            )
          );
        }

        showToast({
          type: 'success',
          title: 'Organ Successfully Delivered!',
          message: 'Delivery signed off. Match record has closed as COMPLETED in history.',
          link: '/history'
        });
      } else {
        showToast({
          type: 'info',
          title: `Transport Status: ${nextStatus.replace('_', ' ')}`,
          message: `Logistics milestone recorded.`
        });
      }
    },
    [matches, simulatedTimeOffsetMinutes, showToast]
  );

  const getTransportByMatchId = useCallback(
    (matchId: string) => {
      return transports.find(t => t.matchId === matchId);
    },
    [transports]
  );

  // Simulation Helpers
  const simulateAdvanceTime = useCallback((minutes: number) => {
    setSimulatedTimeOffsetMinutes(prev => prev + minutes);
  }, []);

  const simulateIncomingMatchProposal = useCallback(() => {
    const nowTime = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
    const simMatch: Match = {
      id: `MATCH-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      donorListingId: 'L-DONOR-882',
      recipientListingId: 'L-REC-STJ-101',
      donorListing: SEED_LISTINGS[0],
      recipientListing: SEED_LISTINGS[6],
      proposingHospitalId: 'hosp-metro-gen',
      receivingHospitalId: 'hosp-st-jude',
      proposingHospitalName: 'Metro General Hospital & Trauma Center',
      receivingHospitalName: 'St. Jude Heart & Lung Institute',
      compatibilityScore: 99,
      distanceKm: 310,
      travelTimeMinutes: 55,
      breakdown: {
        bloodGroup: 100,
        hlaScore: 98,
        distanceScore: 85,
        urgencyScore: 100,
        viabilityFeasible: true
      },
      status: 'PROPOSED',
      proposedAt: new Date(nowTime).toISOString(),
      respondByDeadline: new Date(nowTime + 45 * 60 * 1000).toISOString(),
      activeLockedListingIds: ['L-DONOR-882', 'L-REC-STJ-101']
    };

    setMatches(prev => [simMatch, ...prev]);
    setNotifications(prev => [
      {
        id: 'notif-sim-' + Date.now(),
        hospitalId: 'hosp-st-jude',
        title: 'URGENT: Donor Heart Match Proposed (O+)',
        message: 'Metro General Hospital proposed Heart for Patient PT-STJ-9941. 45m response countdown.',
        type: 'PROPOSAL_RECEIVED',
        timestamp: new Date(nowTime).toISOString(),
        read: false,
        link: '/requests',
        isUrgent: true
      },
      ...prev
    ]);

    showToast({
      type: 'warning',
      title: 'Incoming Proposal Simulated!',
      message: 'Switch to St. Jude or view /requests to test the response countdown.',
      link: '/requests'
    });
  }, [simulatedTimeOffsetMinutes, showToast]);

  const simulateTriggerViabilityAlert = useCallback(() => {
    showToast({
      type: 'error',
      title: 'Viability Alert Simulated',
      message: 'Cold ischemia window critical (< 30 min remaining) on active listing #H-882.',
      link: '/listings'
    });
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
    showToast({
      type: 'info',
      title: 'Platform Reset',
      message: 'All mock hospitals, listings, matches and transports restored to clean seed state.'
    });
  }, [showToast]);

  const value = useMemo(
    () => ({
      currentRole,
      currentHospitalId,
      currentHospital,
      setCurrentRole,
      setCurrentHospitalId,
      hospitals,
      registerHospital,
      approveHospital,
      rejectHospital,
      listings,
      createListing,
      getListingById,
      matches,
      proposeMatch,
      confirmMatch,
      declineMatch,
      transports,
      getTransportByMatchId,
      advanceTransportStatus,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      dismissToast,
      showToast,
      simulateIncomingMatchProposal,
      simulateAdvanceTime,
      simulateTriggerViabilityAlert,
      resetAllData,
      simulatedTimeOffsetMinutes
    }),
    [
      currentRole,
      currentHospitalId,
      currentHospital,
      hospitals,
      registerHospital,
      approveHospital,
      rejectHospital,
      listings,
      createListing,
      getListingById,
      matches,
      proposeMatch,
      confirmMatch,
      declineMatch,
      transports,
      getTransportByMatchId,
      advanceTransportStatus,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      dismissToast,
      showToast,
      simulateIncomingMatchProposal,
      simulateAdvanceTime,
      simulateTriggerViabilityAlert,
      resetAllData,
      simulatedTimeOffsetMinutes
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
