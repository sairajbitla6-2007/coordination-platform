'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';

export default function MatchConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { matches, getTransportByMatchId } = usePlatform();

  const match = matches.find(m => m.id === id);
  const transport = getTransportByMatchId(id);

  if (!match) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-surface-container-low rounded-2xl text-center">
        <h2 className="text-lg font-semibold text-on-surface">Match Record Not Found</h2>
        <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline mt-2 inline-block">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const donor = match.donorListing;
  const recipient = match.recipientListing;

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-surface-container-lowest rounded-3xl p-6 sm:p-10 text-center border border-outline-variant/30 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/20 to-transparent pointer-events-none" />

          {/* Animated Clinical Badge */}
          <div className="relative mb-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary-fixed flex items-center justify-center mx-auto relative z-10 shadow-lg ring-8 ring-primary/10">
              <span className="material-symbols-outlined text-on-primary-fixed text-[54px]">
                verified
              </span>
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          </div>

          <div className="space-y-1.5 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mb-1">
              Mutual Acceptance Recorded
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Match Successfully Coordinated
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
              Surgical protocol handoff initiated. Cold ischemia clock is running.
            </p>
          </div>

          {/* Clinical Card Details */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 text-left text-xs space-y-3.5 relative z-10">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">domain</span>
                <div>
                  <span className="font-semibold text-on-surface block">{match.receivingHospitalName}</span>
                  <span className="text-[10px] text-on-surface-variant">Recipient Surgical Center</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-on-surface">Match #{match.id}</span>
                <span className="text-[10px] text-primary font-bold block">{match.compatibilityScore}% Compatibility</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Organ & Blood</span>
                <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]">favorite</span>
                  {donor.organType} (Donor {donor.bloodType} → Rec {recipient.bloodType})
                </span>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Estimated Transit</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  {match.travelTimeMinutes} min ({match.distanceKm} km)
                </span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2 relative z-10">
            <Link
              href={`/transport/${match.id}`}
              className="w-full bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              Launch Real-Time Transport Telemetry
            </Link>

            <Link
              href="/dashboard"
              className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold py-3 px-6 rounded-2xl transition-colors block text-center"
            >
              Return to Hospital Dashboard
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
