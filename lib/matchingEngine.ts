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

export function isBloodCompatible(donorBlood: BloodType, recipientBlood: BloodType): boolean {
  const allowed = ABO_COMPATIBILITY[donorBlood] || [];
  return allowed.includes(recipientBlood);
}

// Calculate HLA match score (0 - 100%)
export function calculateHLAScore(donorHLA: Listing['hlaTyping'], recipientHLA: Listing['hlaTyping']): number {
  let matchedCount = 0;
  let totalCompared = 0;

  // Locus A
  if (donorHLA.a && recipientHLA.a) {
    totalCompared += 2;
    matchedCount += donorHLA.a.filter(allele => recipientHLA.a.includes(allele)).length;
  }
  // Locus B
  if (donorHLA.b && recipientHLA.b) {
    totalCompared += 2;
    matchedCount += donorHLA.b.filter(allele => recipientHLA.b.includes(allele)).length;
  }
  // Locus DR
  if (donorHLA.dr && recipientHLA.dr) {
    totalCompared += 2;
    matchedCount += donorHLA.dr.filter(allele => recipientHLA.dr.includes(allele)).length;
  }

  if (totalCompared === 0) return 80; // default baseline
  const score = Math.round((Math.min(matchedCount, totalCompared) / totalCompared) * 100);
  return Math.max(50, score);
}

export function findMatchesForListing(
  targetListing: Listing,
  allListings: Listing[]
): MatchCandidate[] {
  if (targetListing.type === 'DONOR') {
    // Find recipient candidates
    const recipients = allListings.filter(
      l => l.type === 'RECIPIENT' && l.organType === targetListing.organType && l.status === 'ACTIVE'
    );

    const candidates: MatchCandidate[] = [];

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
          // Transit would exceed or dangerously cut close to remaining cold ischemia time
          viabilityFeasible = false;
        }
      }

      // Distance score (closer = higher score, e.g. <50km = 100, 500km = 60)
      const distanceScore = Math.max(40, Math.round(100 - (distance / 600) * 50));

      // Urgency boost
      let urgencyScore = 70;
      if (rec.urgencyLevel === '1A_CRITICAL') urgencyScore = 100;
      else if (rec.urgencyLevel === '1B_URGENT') urgencyScore = 85;

      // Waiting time bonus (longer wait = slight tie-breaker boost)
      const daysWaiting = rec.waitingSince
        ? Math.floor((Date.now() - new Date(rec.waitingSince).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      const waitBonus = Math.min(5, Math.round(daysWaiting / 60));

      // Weighted Composite Compatibility Score:
      // HLA: 40%, Blood (compatible): 20%, Urgency: 25%, Distance: 15%
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

      candidates.push({
        recipientListing: rec,
        compatibilityScore: compositeScore,
        distanceKm: distance,
        estimatedTransitMinutes: transitMin,
        breakdown,
        rank: 0
      });
    }

    // Sort by compatibility score descending, then urgency
    candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    candidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    return candidates;
  } else {
    // If target is Recipient, find Donor candidates
    const donors = allListings.filter(
      l => l.type === 'DONOR' && l.organType === targetListing.organType && l.status === 'ACTIVE'
    );

    const candidates: MatchCandidate[] = [];

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

      candidates.push({
        recipientListing: targetListing,
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

    candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    candidates.forEach((c, idx) => {
      c.rank = idx + 1;
    });

    return candidates;
  }
}
