'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function UrgentAlertBanner() {
  const { listings, matches, currentHospitalId, currentRole } = usePlatform();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || currentRole === 'ADMIN') return null;

  // 1. Check for incoming match proposals for current hospital
  const pendingIncoming = matches.find(
    m => m.status === 'PROPOSED' && m.receivingHospitalId === currentHospitalId
  );

  // 2. Check for active donor listings with < 60 min viability remaining
  const criticalDonorListing = listings.find(l => {
    if (l.type === 'DONOR' && l.status === 'ACTIVE' && l.viabilityDeadline && l.hospitalId === currentHospitalId) {
      const diffMs = new Date(l.viabilityDeadline).getTime() - Date.now();
      return diffMs > 0 && diffMs <= 60 * 60 * 1000;
    }
    return false;
  });

  if (!pendingIncoming && !criticalDonorListing) return null;

  if (pendingIncoming) {
    return (
      <section className="mb-6">
        <div className="relative w-full rounded-xl p-4 md:p-5 overflow-hidden bg-error-container text-on-error-container shadow-md flex items-start gap-4 animate-pulse-urgent border border-error/40">
          <span className="material-symbols-outlined text-error text-[32px] shrink-0">emergency</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-error">
                URGENT MATCH PROPOSAL RECEIVED
              </span>
              <span className="text-xs font-bold bg-error text-on-error px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[13px]">timer</span> Response Window Active
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1 text-on-error-container">
              {pendingIncoming.donorListing.organType} ({pendingIncoming.donorListing.bloodType}) Proposal from{' '}
              {pendingIncoming.proposingHospitalName}
            </h3>
            <p className="text-sm opacity-90 mb-4 text-on-error-container/90">
              Matched for Patient #{pendingIncoming.recipientListing.recipientPatientId}. Compatibility Score:{' '}
              <strong className="font-bold">{pendingIncoming.compatibilityScore}%</strong>. Requires surgical confirmation.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/requests"
                className="bg-error text-on-error font-semibold text-xs md:text-sm px-5 py-2 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
              >
                Review Proposal <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="bg-transparent text-error hover:bg-error/10 font-medium text-xs md:text-sm px-3 py-2 rounded-full transition-colors"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (criticalDonorListing) {
    return (
      <section className="mb-6">
        <div className="relative w-full rounded-xl p-4 md:p-5 overflow-hidden bg-error-container text-on-error-container shadow-md flex items-start gap-4 animate-pulse-urgent border border-error/40">
          <span className="material-symbols-outlined text-error text-[32px] shrink-0">warning</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-error">
                Critical Viability Window
              </span>
              <span className="text-xs font-bold bg-error text-on-error px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[13px]">timer</span> &lt; 45m left
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1 text-on-error-container">
              {criticalDonorListing.organType} ({criticalDonorListing.bloodType}) Viability Closing Rapidly
            </h3>
            <p className="text-sm opacity-90 mb-4 text-on-error-container/90">
              Donor listing #{criticalDonorListing.id} requires immediate matching and surgical dispatch before cold ischemia limit expires.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/listings/${criticalDonorListing.id}/matches`}
                className="bg-error text-on-error font-semibold text-xs md:text-sm px-5 py-2 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
              >
                View Top Ranked Matches <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="bg-transparent text-error hover:bg-error/10 font-medium text-xs md:text-sm px-3 py-2 rounded-full transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
