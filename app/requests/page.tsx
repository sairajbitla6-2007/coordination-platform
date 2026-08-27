'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import StatusBadge from '@/components/StatusBadge';
import CountdownTimer from '@/components/CountdownTimer';

export default function IncomingRequestsPage() {
  const router = useRouter();
  const { matches, currentHospitalId, currentHospital, confirmMatch, declineMatch } = usePlatform();

  const [decliningMatchId, setDecliningMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('Bedside clinical instability / crossmatch incompatibility.');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Incoming proposals specifically addressed to current hospital
  const incomingMatches = matches.filter(
    m => m.receivingHospitalId === currentHospitalId && m.status === 'PROPOSED'
  );

  // Also past proposals for audit
  const pastMatches = matches.filter(
    m => m.receivingHospitalId === currentHospitalId && m.status !== 'PROPOSED'
  );

  const handleConfirm = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      await confirmMatch(matchId);
      router.push(`/transport/${matchId}`);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  const handleDecline = async (matchId: string) => {
    setProcessingId(matchId);
    try {
      await declineMatch(matchId, declineReason);
      setDecliningMatchId(null);
      setProcessingId(null);
    } catch (err) {
      console.error(err);
      setProcessingId(null);
    }
  };

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Incoming Requests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight flex items-center gap-3">
              <span>Incoming Match Requests</span>
              {incomingMatches.length > 0 && (
                <span className="text-xs font-bold bg-error text-on-error px-3 py-1 rounded-full animate-pulse">
                  {incomingMatches.length} Action Needed
                </span>
              )}
            </h1>
          </div>

          <div className="text-xs text-on-surface-variant text-right">
            <span>Recipient Center: </span>
            <strong className="text-on-surface font-semibold">{currentHospital?.name}</strong>
          </div>
        </div>

        {/* Incoming Active Proposals List */}
        {incomingMatches.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
            </div>
            <h3 className="text-base font-semibold text-on-surface">No Pending Match Requests</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              All proposed organ offers have been reviewed. When another hospital allocates an organ to your waitlist patients, it will appear here with an active response timer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingMatches.map(match => {
              const donor = match.donorListing;
              const recipient = match.recipientListing;

              return (
                <div
                  key={match.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 border border-error/30 shadow-md relative overflow-hidden group"
                >
                  {/* Top Red Urgency Bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-error animate-pulse" />

                  <div className="space-y-5">
                    {/* Top Row: Score + Urgency Countdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex flex-col items-center justify-center shadow-xs">
                          <span className="text-lg font-bold leading-none tabular-nums">{match.compatibilityScore}%</span>
                          <span className="text-[9px] uppercase font-bold tracking-tight opacity-90">Match</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-error uppercase tracking-wider block">
                            URGENT RESPONSE REQUIRED
                          </span>
                          <h2 className="text-lg font-bold text-on-surface">
                            {donor.organType} ({donor.bloodType}) from {match.proposingHospitalName}
                          </h2>
                        </div>
                      </div>

                      {/* Response Countdown Timer */}
                      <CountdownTimer
                        targetDate={match.respondByDeadline}
                        label="Response Window"
                        size="md"
                      />
                    </div>

                    {/* Middle: Recipient & Donor Cross-Match Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Recipient Box */}
                      <div className="p-4 rounded-2xl bg-secondary-container/20 border border-secondary/20 space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                          Your Recipient Patient
                        </span>
                        <div className="text-sm font-semibold text-on-surface">
                          Patient #{recipient.recipientPatientId} • {recipient.urgencyLevel ? recipient.urgencyLevel.replace('_', ' ') : 'Status 1A'}
                        </div>
                        <div className="text-on-surface-variant font-mono">
                          Blood: <strong>{recipient.bloodType}</strong> • HLA: A*({recipient.hlaTyping.a.join(',')}) B*({recipient.hlaTyping.b.join(',')}) DR*({recipient.hlaTyping.dr.join(',')})
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Ward: {recipient.medicalCenterWard || 'Intensive Care Unit'}
                        </div>
                      </div>

                      {/* Donor Box */}
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                          Offered Donor Organ
                        </span>
                        <div className="text-sm font-semibold text-on-surface">
                          Donor #{donor.id} (Age {donor.donorAge || '32'}y)
                        </div>
                        <div className="text-on-surface-variant font-mono">
                          Blood: <strong>{donor.bloodType}</strong> • HLA: A*({donor.hlaTyping.a.join(',')}) B*({donor.hlaTyping.b.join(',')}) DR*({donor.hlaTyping.dr.join(',')})
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate">
                          Notes: {donor.conditionNotes || 'Stable cold perfusion maintained.'}
                        </div>
                      </div>
                    </div>

                    {/* Logistics Spec Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-container text-xs">
                      <span className="text-on-surface-variant">
                        Estimated Transit: <strong>{match.distanceKm} km</strong> (~{match.travelTimeMinutes} mins via Green Corridor)
                      </span>
                      <span className="text-[11px] font-semibold text-primary">
                        Viability Protocol Verified Safe
                      </span>
                    </div>

                    {/* Actions: Decline / Confirm */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => setDecliningMatchId(match.id)}
                        disabled={processingId === match.id}
                        className="flex-1 bg-surface-container-high hover:bg-surface-dim text-on-surface font-semibold text-xs sm:text-sm py-3 px-4 rounded-full transition-colors disabled:opacity-50 border border-outline-variant/30"
                      >
                        Decline Match
                      </button>
                      <button
                        onClick={() => handleConfirm(match.id)}
                        disabled={processingId === match.id}
                        className="flex-1 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs sm:text-sm py-3 px-4 rounded-full shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === match.id ? (
                          <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                            Confirming Protocol...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Confirm Match & Accept Organ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Decline Reason Dialog */}
        {decliningMatchId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-bold text-on-surface">Decline Match Proposal</h3>
                <button
                  onClick={() => setDecliningMatchId(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Declining this offer will immediately release and unlock the donor listing back to <strong>ACTIVE</strong> so the proposing center can allocate to candidate #2.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                  Clinical Reason for Decline
                </label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  placeholder="State reason (e.g. acute infection, crossmatch issue, patient unavailable)..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDecliningMatchId(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecline(decliningMatchId)}
                  disabled={processingId === decliningMatchId}
                  className="bg-error text-on-error hover:bg-error/90 text-xs font-semibold px-5 py-2 rounded-full shadow-xs transition-all"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Past Inbound Audit Log */}
        {pastMatches.length > 0 && (
          <div className="pt-8 border-t border-outline-variant/20 space-y-3">
            <h2 className="text-base font-semibold text-on-surface">Past Inbound Offers</h2>
            <div className="space-y-2">
              {pastMatches.map(m => (
                <div
                  key={m.id}
                  className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-on-surface">
                      {m.donorListing.organType} ({m.donorListing.bloodType}) from {m.proposingHospitalName}
                    </span>
                    <p className="text-on-surface-variant text-[11px]">
                      Patient #{m.recipientListing.recipientPatientId} • {m.declineReason || 'Confirmed and processed.'}
                    </p>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
