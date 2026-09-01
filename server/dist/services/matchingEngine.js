"use strict";
// ─────────────────────────────────────────────────────────────────
// OrganLink — Clinical Matching Engine (TypeScript Port)
// ─────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBloodCompatible = isBloodCompatible;
exports.calculateHlaScore = calculateHlaScore;
exports.calculateHaversineDistance = calculateHaversineDistance;
exports.calculateTransitTimeMinutes = calculateTransitTimeMinutes;
exports.calculateDistanceScore = calculateDistanceScore;
exports.calculateUrgencyScore = calculateUrgencyScore;
exports.calculateMatchScore = calculateMatchScore;
// ── Blood Compatibility Matrix ─────────────────────────────────────
const BLOOD_COMPATIBILITY = {
    O_NEGATIVE: ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
    O_POSITIVE: ['O_POSITIVE', 'A_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE'],
    A_NEGATIVE: ['A_NEGATIVE', 'A_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
    A_POSITIVE: ['A_POSITIVE', 'AB_POSITIVE'],
    B_NEGATIVE: ['B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE'],
    B_POSITIVE: ['B_POSITIVE', 'AB_POSITIVE'],
    AB_NEGATIVE: ['AB_NEGATIVE', 'AB_POSITIVE'],
    AB_POSITIVE: ['AB_POSITIVE'],
};
function isBloodCompatible(donorGroup, recipientGroup) {
    const allowedRecipients = BLOOD_COMPATIBILITY[donorGroup] || [];
    return allowedRecipients.includes(recipientGroup);
}
// ── HLA Loci Scoring ───────────────────────────────────────────────
function calculateHlaScore(donorHla, recipientHla) {
    if (!donorHla || !recipientHla)
        return 80.0;
    let matches = 0;
    let totalLoci = 0;
    const loci = ['a', 'b', 'dr'];
    for (const locus of loci) {
        const dLocus = donorHla[locus] || [];
        const rLocus = recipientHla[locus] || [];
        if (dLocus.length > 0 && rLocus.length > 0) {
            totalLoci += Math.max(dLocus.length, rLocus.length);
            const rSet = new Set(rLocus.map(x => x.toLowerCase().trim()));
            for (const val of dLocus) {
                if (rSet.has(val.toLowerCase().trim())) {
                    matches++;
                }
            }
        }
    }
    if (totalLoci === 0)
        return 80.0;
    const ratio = matches / totalLoci;
    return Math.min(100.0, Math.max(50.0, Math.round((50.0 + ratio * 50.0) * 100) / 100));
}
// ── Distance & Transit Calculation ─────────────────────────────────
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
        return 150.0; // Default estimate in km
    }
    const R = 6371.0; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}
function calculateTransitTimeMinutes(distanceKm) {
    if (distanceKm <= 50)
        return Math.round(25 + distanceKm * 0.8);
    if (distanceKm <= 300)
        return Math.round(40 + distanceKm * 0.5);
    return Math.round(90 + distanceKm * 0.2); // Flight + Ground transit
}
function calculateDistanceScore(distanceKm) {
    if (distanceKm <= 20)
        return 100;
    return Math.max(40, Math.round((100 - (distanceKm / 600) * 50) * 10) / 10);
}
// ── Urgency Scoring ────────────────────────────────────────────────
function calculateUrgencyScore(urgencyLevel, registeredAt) {
    const baseScores = {
        CRITICAL: 100,
        HIGH: 85,
        MEDIUM: 70,
        LOW: 55,
    };
    const base = baseScores[urgencyLevel] || 70;
    if (!registeredAt)
        return base;
    const daysWaiting = Math.max(0, (Date.now() - new Date(registeredAt).getTime()) / (1000 * 3600 * 24));
    const waitingBonus = Math.min(15, Math.round(daysWaiting * 0.2 * 10) / 10);
    return Math.min(100, base + waitingBonus);
}
// ── Full Composite Match Calculation ───────────────────────────────
function calculateMatchScore(params) {
    const compatibleBlood = isBloodCompatible(params.donorBloodGroup, params.recipientBloodGroup);
    if (!compatibleBlood) {
        return {
            compatible: false,
            breakdown: { blood: 0, hla: 0, distance: 0, urgency: 0, viability_feasible: false, composite: 0 },
            distanceKm: 0,
            transitMinutes: 0,
        };
    }
    const bloodScore = 100.0;
    const hlaScore = calculateHlaScore(params.donorHla, params.recipientHla);
    const distanceKm = calculateHaversineDistance(params.donorLat, params.donorLon, params.recipientLat, params.recipientLon);
    const transitMinutes = calculateTransitTimeMinutes(distanceKm);
    const distanceScore = calculateDistanceScore(distanceKm);
    const urgencyScore = calculateUrgencyScore(params.urgencyLevel, params.registeredAt);
    const maxViabilityMin = (params.coldIschemiaHours || 12) * 60;
    const viabilityFeasible = transitMinutes <= maxViabilityMin;
    const composite = Math.round((bloodScore * 0.35 + hlaScore * 0.25 + distanceScore * 0.20 + urgencyScore * 0.20) * 100) / 100;
    return {
        compatible: true,
        distanceKm,
        transitMinutes,
        breakdown: {
            blood: bloodScore,
            hla: hlaScore,
            distance: distanceScore,
            urgency: urgencyScore,
            viability_feasible: viabilityFeasible,
            composite,
        },
    };
}
