import { BloodType, Listing, MatchCandidate, MatchScoreBreakdown, OrganType } from './types';

// Blood Group Compatibility Matrix
// Key = Donor Blood Group, Value = Compatible Recipient Blood Groups
const ABO_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'] // Universal recipient
};

// Maximum Cold Ischemia Time allowed per organ type (hours)
export const MAX_VIABILITY_HOURS: Record<OrganType, number> = {
  'Heart': 4,
  'Lung': 6,
  'Liver': 12,
  'Pancreas': 12,
  'Intestine': 8,
  'Kidney': 24,
  'Cornea': 72
};

// Approximate hospital distance matrix (mocked in km)
const HOSPITAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'hosp-metro-gen': { lat: 12.9716, lng: 77.5946 }, // Bangalore
  'hosp-st-jude': { lat: 13.0827, lng: 80.2707 },   // Chennai (approx 300km)
  'hosp-apollo-care': { lat: 12.9352, lng: 77.6245 }, // Bangalore South (15km)
  'hosp-city-med': { lat: 17.3850, lng: 78.4867 },    // Hyderabad (approx 500km)
  'hosp-hope-center': { lat: 12.9141, lng: 77.6109 }
};

export function calculateDistance(hospAId: string, hospBId: string): number {
  const posA = HOSPITAL_COORDINATES[hospAId] || { lat: 12.97, lng: 77.59 };
  const posB = HOSPITAL_COORDINATES[hospBId] || { lat: 13.08, lng: 80.27 };

  const R = 6371; // Earth radius km
  const dLat = ((posB.lat - posA.lat) * Math.PI) / 180;
  const dLng = ((posB.lng - posA.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((posA.lat * Math.PI) / 180) *
      Math.cos((posB.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = Math.round(R * c);
  return Math.max(12, d); // Minimum 12km in intra-city
}

// Estimate transit minutes based on distance (green corridor vs air charter)
export function estimateTransitTimeMinutes(distanceKm: number): number {
  if (distanceKm <= 50) {
    // City green corridor: avg 60 km/h
    return Math.round((distanceKm / 60) * 60 + 15); // +15 min prep
  } else {
    // Air charter / flight transit: avg 350 km/h + 45 min airport protocol
    return Math.round((distanceKm / 350) * 60 + 45);
  }
}

export function normalizeBlood(blood: string): BloodType {
  if (!blood) return 'O+';
  let clean = String(blood).replace(/^Blood\s+/i, '').replace(/_/g, '').trim().toUpperCase();
  if (clean === 'APOSITIVE' || clean === 'A+') return 'A+';
  if (clean === 'ANEGATIVE' || clean === 'A-') return 'A-';
  if (clean === 'BPOSITIVE' || clean === 'B+') return 'B+';
  if (clean === 'BNEGATIVE' || clean === 'B-') return 'B-';
  if (clean === 'ABPOSITIVE' || clean === 'AB+') return 'AB+';
  if (clean === 'ABNEGATIVE' || clean === 'AB-') return 'AB-';
  if (clean === 'OPOSITIVE' || clean === 'O+') return 'O+';
  if (clean === 'ONEGATIVE' || clean === 'O-') return 'O-';
  return clean as BloodType;
}

export function isBloodCompatible(donorBlood: string, recipientBlood: string): boolean {
  const normDonor = normalizeBlood(donorBlood);
  const normRecipient = normalizeBlood(recipientBlood);
  const allowed = ABO_COMPATIBILITY[normDonor] || [normDonor];
  return allowed.includes(normRecipient) || normDonor === normRecipient;
}

export function normalizeOrgan(organ: string): string {
  return String(organ || '').trim().toUpperCase();
}

// Calculate HLA match score (0 - 100%)
export function calculateHLAScore(donorHLA: Listing['hlaTyping'], recipientHLA: Listing['hlaTyping']): number {
  if (!donorHLA || !recipientHLA) return 85;

  const getArray = (arr: any) => (Array.isArray(arr) ? arr.map(x => String(x).trim().toUpperCase()) : []);
  const donorA = getArray(donorHLA.a);
  const recipientA = getArray(recipientHLA.a);
  const donorB = getArray(donorHLA.b);
  const recipientB = getArray(recipientHLA.b);
  const donorDR = getArray(donorHLA.dr);
  const recipientDR = getArray(recipientHLA.dr);

  let matchedCount = 0;
  let totalCompared = 0;

  if (donorA.length > 0 && recipientA.length > 0) {
    totalCompared += donorA.length;
    matchedCount += donorA.filter(allele => recipientA.includes(allele)).length;
  }
  if (donorB.length > 0 && recipientB.length > 0) {
    totalCompared += donorB.length;
    matchedCount += donorB.filter(allele => recipientB.includes(allele)).length;
  }
  if (donorDR.length > 0 && recipientDR.length > 0) {
    totalCompared += donorDR.length;
    matchedCount += donorDR.filter(allele => recipientDR.includes(allele)).length;
  }

  if (totalCompared === 0) return 85;
  const score = Math.round((Math.min(matchedCount, totalCompared) / totalCompared) * 100);
  return Math.max(50, score);
}

export function findMatchesForListing(
  targetListing: Listing,
  allListings: Listing[]
): MatchCandidate[] {
  const targetOrganNorm = normalizeOrgan(targetListing.organType);
  const isActiveStatus = (s: string) => ['ACTIVE', 'AVAILABLE', 'ACTIVE_POOL', 'PENDING'].includes(String(s || '').toUpperCase());

  // Deduplicate input listings by ID and content signature
  const uniqueListingsMap = new Map<string, Listing>();
  for (const l of allListings) {
    if (!l || !l.id) continue;
    if (!uniqueListingsMap.has(l.id)) {
      uniqueListingsMap.set(l.id, l);
    }
  }
  const deduplicatedListings = Array.from(uniqueListingsMap.values());

  if (targetListing.type === 'DONOR') {
    // Find recipient candidates
    const recipients = deduplicatedListings.filter(
      l => l.type === 'RECIPIENT' &&
           normalizeOrgan(l.organType) === targetOrganNorm &&
           isActiveStatus(l.status) &&
           l.id !== targetListing.id
    );

    const rawCandidates: MatchCandidate[] = [];

    for (const rec of recipients) {
      const bloodCompat = isBloodCompatible(targetListing.bloodType, rec.bloodType);
      if (!bloodCompat) continue; // Blood incompatibility is hard disqualifier in direct match

      const hlaScore = calculateHLAScore(targetListing.hlaTyping, rec.hlaTyping);
      const distance = calculateDistance(targetListing.hospitalId, rec.hospitalId);
      const transitMin = estimateTransitTimeMinutes(distance);

      // Check viability remaining
      let viabilityFeasible = true;
      if (targetListing.viabilityDeadline) {
        const remainingMs = new Date(targetListing.viabilityDeadline).getTime() - Date.now();
        const remainingMinutes = remainingMs / 60000;
        if (remainingMinutes < transitMin + 30) {
          viabilityFeasible = false;
        }
      }

      const distanceScore = Math.max(40, Math.round(100 - (distance / 600) * 50));

      let urgencyScore = 70;
      if (rec.urgencyLevel === '1A_CRITICAL') urgencyScore = 100;
      else if (rec.urgencyLevel === '1B_URGENT') urgencyScore = 85;

      const daysWaiting = rec.waitingSince
        ? Math.floor((Date.now() - new Date(rec.waitingSince).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      const waitBonus = Math.min(5, Math.round(daysWaiting / 60));

      const compositeScore = Math.min(
        99,
        Math.round(
          hlaScore * 0.40 +
          100 * 0.20 +
          urgencyScore * 0.25 +
          distanceScore * 0.15 +
          waitBonus
        )
      );

      const breakdown: MatchScoreBreakdown = {
        bloodGroup: 100,
        hlaScore,
        distanceScore,
        urgencyScore,
        viabilityFeasible
      };

      rawCandidates.push({
        recipientListing: rec,
        compatibilityScore: compositeScore,
        distanceKm: distance,
        estimatedTransitMinutes: transitMin,
        breakdown,
        rank: 0
      });
    }

    // Deduplicate candidates by recipient ID AND content signature
    const seenRecIds = new Set<string>();
    const seenContentKeys = new Set<string>();
    const finalCandidates: MatchCandidate[] = [];
    for (const c of rawCandidates) {
      const rec = c.recipientListing;
      const contentKey = `${(rec.hospitalName || '').toLowerCase().trim()}_${rec.organType}_${rec.bloodType}_${rec.donorAge || rec.recipientAge || ''}_${rec.donorGender || rec.recipientGender || ''}`;
      if (!seenRecIds.has(rec.id) && !seenContentKeys.has(contentKey)) {
        seenRecIds.add(rec.id);
        seenContentKeys.add(contentKey);
        finalCandidates.push(c);
      }
    }

    finalCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    finalCandidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    return finalCandidates;
  } else {
    // If target is Recipient, find Donor candidates
    const donors = deduplicatedListings.filter(
      l => l.type === 'DONOR' &&
           normalizeOrgan(l.organType) === targetOrganNorm &&
           isActiveStatus(l.status) &&
           l.id !== targetListing.id
    );

    const rawCandidates: MatchCandidate[] = [];

    for (const donor of donors) {
      const bloodCompat = isBloodCompatible(donor.bloodType, targetListing.bloodType);
      if (!bloodCompat) continue;

      const hlaScore = calculateHLAScore(donor.hlaTyping, targetListing.hlaTyping);
      const distance = calculateDistance(donor.hospitalId, targetListing.hospitalId);
      const transitMin = estimateTransitTimeMinutes(distance);

      let viabilityFeasible = true;
      if (donor.viabilityDeadline) {
        const remainingMs = new Date(donor.viabilityDeadline).getTime() - Date.now();
        const remainingMinutes = remainingMs / 60000;
        if (remainingMinutes < transitMin + 30) {
          viabilityFeasible = false;
        }
      }

      const distanceScore = Math.max(40, Math.round(100 - (distance / 600) * 50));
      const urgencyScore = targetListing.urgencyLevel === '1A_CRITICAL' ? 100 : 80;

      const compositeScore = Math.min(
        99,
        Math.round(
          hlaScore * 0.40 +
          100 * 0.20 +
          urgencyScore * 0.25 +
          distanceScore * 0.15
        )
      );

      rawCandidates.push({
        recipientListing: donor, // Matching donor organ listing
        compatibilityScore: compositeScore,
        distanceKm: distance,
        estimatedTransitMinutes: transitMin,
        breakdown: {
          bloodGroup: 100,
          hlaScore,
          distanceScore,
          urgencyScore,
          viabilityFeasible
        },
        rank: 0
      });
    }

    // Deduplicate candidates by donor ID AND content signature
    const seenDonorIds = new Set<string>();
    const seenContentKeys = new Set<string>();
    const finalCandidates: MatchCandidate[] = [];
    for (const c of rawCandidates) {
      const donor = c.recipientListing;
      const contentKey = `${(donor.hospitalName || '').toLowerCase().trim()}_${donor.organType}_${donor.bloodType}_${donor.donorAge || donor.recipientAge || ''}_${donor.donorGender || donor.recipientGender || ''}`;
      if (!seenDonorIds.has(donor.id) && !seenContentKeys.has(contentKey)) {
        seenDonorIds.add(donor.id);
        seenContentKeys.add(contentKey);
        finalCandidates.push(c);
      }
    }

    finalCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    finalCandidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    return finalCandidates;
  }
}
