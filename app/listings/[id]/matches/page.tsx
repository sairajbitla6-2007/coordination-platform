'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import StatusBadge from '@/components/StatusBadge';
import CountdownTimer from '@/components/CountdownTimer';
import { findMatchesForListing } from '@/lib/matchingEngine';
import { MatchCandidate } from '@/lib/types';

export default function MatchResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { listings, proposeMatch, getListingById } = usePlatform();

  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [isProposing, setIsProposing] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  const targetListing = getListingById(id);

  // Compute live match candidates
  const candidates = useMemo(() => {
    if (!targetListing) return [];
    const all = findMatchesForListing(targetListing, listings);
    if (minScoreFilter > 0) {
      return all.filter(c => c.compatibilityScore >= minScoreFilter);
    }
    return all;
  }, [targetListing, listings, minScoreFilter]);

  if (!targetListing) {
    return (
      <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
        <div className="max-w-md mx-auto my-16 p-8 bg-surface-container-low rounded-2xl text-center border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[48px] mb-2">search_off</span>
          <h2 className="text-lg font-semibold text-on-surface">Listing Not Found</h2>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">No listing with ID #{id} was found.</p>
          <Link href="/listings" className="text-xs font-semibold text-primary hover:underline">
            ← Back to My Listings
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const isDonor = targetListing.type === 'DONOR';

  const handleSendProposal = async () => {
    if (!selectedCandidate || !targetListing) return;
    setIsProposing(true);

    try {
      if (isDonor) {
        await proposeMatch(targetListing.id, selectedCandidate.recipientListing.id);
      } else {
        await proposeMatch(selectedCandidate.recipientListing.id, targetListing.id);
      }
      setSelectedCandidate(null);
      router.push('/listings');
    } catch (err) {
      console.error(err);
      setIsProposing(false);
    }
  };

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href="/listings" className="hover:underline">Listings</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">#{targetListing.id}</span>
              <span>/</span>
              <span>AI Match Results</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight flex items-center gap-3">
              <span>Compatibility Candidates</span>
              <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                {candidates.length} Matches Found
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/listings"
              className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-outline-variant/30 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Listings
            </Link>
          </div>
        </div>

        {/* Source Listing Context Card */}
        <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isDonor ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[26px]">
                  {targetListing.organType === 'Heart'
                    ? 'favorite'
                    : targetListing.organType === 'Kidney'
                    ? 'grain'
                    : targetListing.organType === 'Liver'
                    ? 'medication'
                    : targetListing.organType === 'Lung'
                    ? 'air'
                    : 'vital_signs'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold bg-surface-container-highest px-2 py-0.5 rounded text-on-surface">
                    {targetListing.type} • {targetListing.organType}
                  </span>
                  <span className="text-xs font-bold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
                    Blood {targetListing.bloodType}
                  </span>
                  <StatusBadge status={targetListing.status} size="sm" />
                </div>
                <h2 className="text-base font-semibold text-on-surface">
                  {isDonor ? `Donor Profile #${targetListing.id}` : `Patient #${targetListing.recipientPatientId}`} • {targetListing.hospitalName}
                </h2>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  HLA Markers: A*({targetListing.hlaTyping.a.join(',')}) B*({targetListing.hlaTyping.b.join(',')}) DR*({targetListing.hlaTyping.dr.join(',')})
                </p>
              </div>
            </div>

            {isDonor && targetListing.viabilityDeadline && (
              <div className="shrink-0">
                <CountdownTimer targetDate={targetListing.viabilityDeadline} label="Cold Ischemia Window" />
              </div>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Ranked by AI Compatibility Score & Urgency Weighting
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold">Min Score:</span>
            {[0, 80, 90, 95].map(score => (
              <button
                key={score}
                onClick={() => setMinScoreFilter(score)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  minScoreFilter === score
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'
                }`}
              >
                {score === 0 ? 'All' : `≥${score}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Match Candidates List */}
        {candidates.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-outline text-[48px]">group_off</span>
            <h3 className="text-base font-semibold text-on-surface">No Compatible Candidates Currently</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              No patients in the regional network currently match the blood group and HLA threshold. New listings entering the pool will auto-notify you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map(candidate => {
              const rec = candidate.recipientListing;
              const isRank1 = candidate.rank === 1;

              return (
                <div
                  key={rec.id}
                  className={`bg-surface-container-lowest rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all relative overflow-hidden group ${
                    isRank1 ? 'border-primary/50 ring-1 ring-primary/20' : 'border-outline-variant/30'
                  }`}
                >
                  {/* Top Highlight line */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${
                      rec.urgencyLevel === '1A_CRITICAL' ? 'bg-error' : isRank1 ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Left: Score Gauge & Recipient Information */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Circular Compatibility Score */}
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-surface-variant"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className={candidate.compatibilityScore >= 95 ? 'text-primary' : 'text-secondary'}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={`${candidate.compatibilityScore}, 100`}
                            strokeLinecap="round"
                            strokeWidth="3.2"
                          />
                        </svg>
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-base font-bold text-on-surface leading-none tabular-nums">
                            {candidate.compatibilityScore}%
                          </span>
                          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tight">
                            Match
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                              isRank1 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                            }`}
                          >
                            AI RANK #{candidate.rank}
                          </span>
                          {rec.urgencyLevel && <StatusBadge status={rec.urgencyLevel} size="sm" />}
                          <span className="text-xs font-semibold text-on-surface-variant">
                            {rec.hospitalName} ({rec.hospitalCity})
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                          <span>Patient #{rec.recipientPatientId}</span>
                          <span className="text-xs font-normal text-on-surface-variant">
                            • Age {rec.recipientAge || '40'}y ({rec.recipientGender || 'F'}) • {rec.medicalCenterWard || 'Cardiology Unit'}
                          </span>
                        </h3>

                        <p className="text-xs text-on-surface-variant font-mono">
                          HLA Alleles: A*({rec.hlaTyping.a.join(',')}) B*({rec.hlaTyping.b.join(',')}) DR*({rec.hlaTyping.dr.join(',')})
                        </p>
                      </div>
                    </div>

                    {/* Middle: Clinical Compatibility Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-3 rounded-xl text-center text-xs shrink-0">
                      <div className="px-2">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                          Blood Group
                        </span>
                        <span className="font-bold text-on-surface">{rec.bloodType} (100% OK)</span>
                      </div>
                      <div className="px-2 border-l border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                          HLA Score
                        </span>
                        <span className="font-bold text-primary tabular-nums">{candidate.breakdown.hlaScore}%</span>
                      </div>
                      <div className="px-2 border-l border-outline-variant/30">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">
                          Distance / Transit
                        </span>
                        <span className="font-bold text-on-surface tabular-nums">
                          {candidate.distanceKm} km (~{candidate.estimatedTransitMinutes}m)
                        </span>
                      </div>
                    </div>

                    {/* Right: Propose Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Propose Match
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Propose Match Confirmation (Prescriptive Rebuild) */}
        {selectedCandidate && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
            style={{ minHeight: '100vh' }}
          >
            <div
              className="relative bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/40 shadow-2xl space-y-6 my-auto text-left animate-in zoom-in-95 duration-150"
              style={{ width: '100%', maxWidth: '640px', boxSizing: 'border-box' }}
            >
              {/* 1. Header block (title + phase/protocol subtitle) — normal block-level flow, full width of modal */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20 w-full">
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-on-surface leading-snug">
                      Confirm Match Proposal
                    </h3>
                    <span className="text-xs text-on-surface-variant font-medium block mt-0.5">
                      Phase: Pre-Proposal Clinical Protocol
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-xl transition-colors shrink-0"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* 2. Donor vs. Recipient row — a two-column layout with visible separation, never overlapping */}
              <div
                className="w-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Donor Column */}
                <div
                  className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2"
                  style={{ minWidth: 0, boxSizing: 'border-box' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full w-fit">
                    Donor Organ
                  </span>
                  <div className="font-bold text-sm sm:text-base text-on-surface break-words">
                    {targetListing.organType} ({targetListing.bloodType})
                  </div>
                  <div className="text-xs text-on-surface-variant break-words leading-relaxed mt-1">
                    <span className="font-semibold text-on-surface">Hospital:</span> {targetListing.hospitalName}
                  </div>
                </div>

                {/* Recipient Column */}
                <div
                  className="p-4 sm:p-5 rounded-2xl bg-secondary-container/20 border border-secondary/30 flex flex-col gap-2"
                  style={{ minWidth: 0, boxSizing: 'border-box' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/15 px-2.5 py-0.5 rounded-full w-fit">
                    Recipient Match
                  </span>
                  <div className="font-bold text-sm sm:text-base text-on-surface break-words">
                    Patient #{selectedCandidate.recipientListing.recipientPatientId} ({selectedCandidate.recipientListing.bloodType})
                  </div>
                  <div className="text-xs text-on-surface-variant break-words leading-relaxed mt-1">
                    <span className="font-semibold text-on-surface">Center:</span> {selectedCandidate.recipientListing.hospitalName}
                  </div>
                </div>
              </div>

              {/* 3. Warning message (listing lock / countdown notice) — full-width block below donor/recipient row */}
              <div
                className="w-full p-4 rounded-2xl bg-error-container/40 border border-error/30 flex items-start gap-3 text-xs text-on-error-container"
                style={{ boxSizing: 'border-box' }}
              >
                <span className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5">warning</span>
                <div className="flex-1 min-w-0">
                  <strong className="font-bold text-error block mb-1">Listing Lock Enforcement</strong>
                  <p className="text-on-surface leading-relaxed">
                    Sending this proposal will lock listing #{targetListing.id} to <strong className="font-bold">PENDING_MATCH</strong> state and start a 45-minute response countdown clock at {selectedCandidate.recipientListing.hospitalName}.
                  </p>
                </div>
              </div>

              {/* 4. Button row (Cancel / Confirm & Send Proposal) — normal flex row at the bottom, both buttons in-flow and side-by-side */}
              <div className="w-full flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  disabled={isProposing}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendProposal}
                  disabled={isProposing}
                  className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProposing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      Locking & Transmitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Confirm & Send Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
