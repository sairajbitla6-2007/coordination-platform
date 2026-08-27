'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import StatusBadge from '@/components/StatusBadge';
import { Match, MatchStatus } from '@/lib/types';

export default function MatchHistoryPage() {
  const { matches, currentHospitalId, currentRole } = usePlatform();

  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // In Admin role, view all national matches; in hospital role, view hospital-involved matches
  const visibleMatches = matches.filter(m => {
    if (currentRole === 'ADMIN') return true;
    return m.proposingHospitalId === currentHospitalId || m.receivingHospitalId === currentHospitalId;
  });

  const filteredMatches = visibleMatches.filter(match => {
    if (statusFilter !== 'ALL' && match.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = match.id.toLowerCase().includes(q);
      const matchOrgan = match.donorListing.organType.toLowerCase().includes(q);
      const matchPropHosp = match.proposingHospitalName.toLowerCase().includes(q);
      const matchRecHosp = match.receivingHospitalName.toLowerCase().includes(q);
      return matchId || matchOrgan || matchPropHosp || matchRecHosp;
    }
    return true;
  });

  return (
    <RoleGuard requiredRole={currentRole === 'ADMIN' ? 'ADMIN' : 'HOSPITAL_USER'} requireVerifiedHospital={true}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href={currentRole === 'ADMIN' ? '/admin/queue' : '/dashboard'} className="hover:underline">
                {currentRole === 'ADMIN' ? 'Admin Desk' : 'Dashboard'}
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Coordination Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight flex items-center gap-3">
              <span>Match & Allocation History</span>
              <span className="text-xs font-bold bg-surface-container-high text-on-surface px-3 py-1 rounded-full">
                {visibleMatches.length} Total Records
              </span>
            </h1>
          </div>

          <div className="text-xs text-on-surface-variant text-right">
            <span>Audit Protocol: </span>
            <strong className="text-on-surface font-semibold">NOTTO National Allocation Trace</strong>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by match ID, organ, hospital..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Status:
            </span>
            {(['ALL', 'COMPLETED', 'CONFIRMED', 'PROPOSED', 'AUTO_DECLINED', 'DECLINED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {st === 'ALL' ? 'All Records' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* History Records Table / Cards */}
        {filteredMatches.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-outline text-[48px]">manage_search</span>
            <h3 className="text-base font-semibold text-on-surface">No Historical Records Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              No matching records match the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(m => {
              const donor = m.donorListing;
              const recipient = m.recipientListing;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[24px]">
                          {donor.organType === 'Heart'
                            ? 'favorite'
                            : donor.organType === 'Kidney'
                            ? 'grain'
                            : donor.organType === 'Liver'
                            ? 'medication'
                            : 'vital_signs'}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">
                            {donor.organType} ({donor.bloodType})
                          </span>
                          <StatusBadge status={m.status} size="sm" />
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {m.compatibilityScore}% AI Match
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-on-surface">
                          Match #{m.id} • {m.proposingHospitalName.split(' ')[0]} → {m.receivingHospitalName.split(' ')[0]}
                        </h3>

                        <p className="text-xs text-on-surface-variant truncate">
                          Recipient Patient #{recipient.recipientPatientId} • Distance {m.distanceKm} km ({m.travelTimeMinutes}m transit)
                        </p>
                      </div>
                    </div>

                    {/* Right details */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
                      <div className="text-left md:text-right text-xs">
                        <span className="text-on-surface-variant text-[11px] block">Proposed Date</span>
                        <span className="font-semibold text-on-surface">
                          {new Date(m.proposedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all text-[20px]">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drilldown Detail Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-outline-variant/30 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Match Audit Dossier #{selectedMatch.id}</h3>
                    <span className="text-xs text-on-surface-variant">Full Clinical & Transport Telemetry Trace</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Status & Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Status</span>
                  <StatusBadge status={selectedMatch.status} size="sm" />
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Score</span>
                  <span className="text-base font-bold text-primary">{selectedMatch.compatibilityScore}%</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">HLA Match</span>
                  <span className="text-base font-bold text-on-surface">{selectedMatch.breakdown.hlaScore}%</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Transit</span>
                  <span className="text-base font-bold text-on-surface">{selectedMatch.travelTimeMinutes} min</span>
                </div>
              </div>

              {/* Center comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Donor Hospital
                  </span>
                  <div className="font-semibold text-sm text-on-surface">{selectedMatch.proposingHospitalName}</div>
                  <div className="text-on-surface-variant">Listing #{selectedMatch.donorListingId}</div>
                  <div className="text-on-surface-variant font-mono">Blood: {selectedMatch.donorListing.bloodType}</div>
                </div>

                <div className="p-4 rounded-xl bg-secondary-container/20 border border-secondary/30 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                    Recipient Hospital
                  </span>
                  <div className="font-semibold text-sm text-on-surface">{selectedMatch.receivingHospitalName}</div>
                  <div className="text-on-surface-variant">Patient #{selectedMatch.recipientListing.recipientPatientId}</div>
                  <div className="text-on-surface-variant font-mono">Blood: {selectedMatch.recipientListing.bloodType}</div>
                </div>
              </div>

              {selectedMatch.declineReason && (
                <div className="p-3 rounded-xl bg-error-container/40 border border-error/20 text-xs">
                  <span className="font-bold text-error block mb-0.5">Decline / Timeout Rationale:</span>
                  <p className="text-on-surface">{selectedMatch.declineReason}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="bg-primary text-on-primary text-xs font-semibold px-6 py-2.5 rounded-full shadow-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
