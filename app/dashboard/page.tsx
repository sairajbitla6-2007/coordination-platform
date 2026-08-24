'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import UrgentAlertBanner from '@/components/UrgentAlertBanner';
import StatusBadge from '@/components/StatusBadge';
import CountdownTimer from '@/components/CountdownTimer';

export default function DashboardPage() {
  const {
    currentHospital,
    currentHospitalId,
    listings,
    matches,
    transports
  } = usePlatform();

  // Statistics for current hospital
  const hospitalListings = listings.filter(l => l.hospitalId === currentHospitalId);
  const activeListingsCount = hospitalListings.filter(l => l.status === 'ACTIVE').length;
  const pendingMatchesCount = matches.filter(
    m => (m.proposingHospitalId === currentHospitalId || m.receivingHospitalId === currentHospitalId) && m.status === 'PROPOSED'
  ).length;
  const incomingRequestsCount = matches.filter(
    m => m.receivingHospitalId === currentHospitalId && m.status === 'PROPOSED'
  ).length;
  const activeTransportsCount = transports.filter(
    t => t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED'
  ).length;

  // Live Matches candidate previews
  const activeDonorListings = hospitalListings.filter(l => l.type === 'DONOR' && (l.status === 'ACTIVE' || l.status === 'PENDING_MATCH'));

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hospital Info & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Transplant Coordination Desk
              </span>
              <span className="text-xs text-on-surface-variant">• {currentHospital?.city}, {currentHospital?.state}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              {currentHospital?.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/listings/new"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Listing
            </Link>
            <Link
              href="/listings"
              className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all border border-outline-variant/30"
            >
              View Listings
            </Link>
          </div>
        </div>

        {/* Active Urgent Match / Expiring Alerts */}
        <UrgentAlertBanner />

        {/* Bento Quick Stats Grid (4 Cards) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Active Listings */}
          <Link
            href="/listings"
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
              <span className="material-symbols-outlined text-[90px]">list_alt</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-primary text-[24px]">list_alt</span>
              <span className="text-[11px] font-semibold text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Manage <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tabular-nums tracking-tight block">
                {activeListingsCount}
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1 block">
                Active Listings
              </span>
            </div>
          </Link>

          {/* Card 2: Matches Pending */}
          <Link
            href="/requests"
            className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-2xl p-5 border border-primary/20 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-inverse-primary text-[24px]">handshake</span>
              {incomingRequestsCount > 0 && (
                <span className="text-[10px] font-bold bg-error text-on-error px-2 py-0.5 rounded-full animate-pulse">
                  {incomingRequestsCount} ACTION NEEDED
                </span>
              )}
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight block">
                {pendingMatchesCount}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-1 block opacity-90">
                Matches Pending
              </span>
            </div>
          </Link>

          {/* Card 3: In Transit */}
          <Link
            href="/transport/MATCH-CONF-002"
            className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">local_shipping</span>
              <span className="text-[11px] font-semibold text-secondary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Live GPS <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tabular-nums tracking-tight block">
                {activeTransportsCount}
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1 block">
                Active In Transit
              </span>
            </div>
          </Link>

          {/* Card 4: Match Success Rate */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-tertiary text-[24px]">fact_check</span>
              <span className="text-[10px] font-bold bg-tertiary-fixed/60 text-on-tertiary-fixed-variant px-2 py-0.5 rounded-full">
                NATIONAL AVG 88%
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tabular-nums tracking-tight block">
                96.4%
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1 block">
                Match Acceptance
              </span>
            </div>
          </div>
        </section>

        {/* Split Panel: Live Matches (8 cols) & Recent Activity (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Matches & Donor Telemetry (8 cols) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">Live Active Listings & Match Radar</h2>
                <p className="text-xs text-on-surface-variant">Real-time candidate compatibility and cold ischemia countdowns</p>
              </div>
              <Link href="/listings" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View All ({hospitalListings.length}) <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            {activeDonorListings.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface-container text-center border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[40px] mb-2">inventory_2</span>
                <h3 className="text-sm font-semibold text-on-surface">No Active Donor Listings</h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">Create a new donor listing to run automated AI cross-matching.</p>
                <Link
                  href="/listings/new"
                  className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> New Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeDonorListings.map(donor => {
                  return (
                    <div
                      key={donor.id}
                      className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      {/* Left: Organ specs */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-secondary-container/60 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[26px]">
                            {donor.organType === 'Heart'
                              ? 'favorite'
                              : donor.organType === 'Kidney'
                              ? 'grain'
                              : donor.organType === 'Liver'
                              ? 'medication'
                              : donor.organType === 'Lung'
                              ? 'air'
                              : 'vital_signs'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold bg-primary text-on-primary px-2 py-0.5 rounded-sm">
                              {donor.organType.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-sm">
                              Blood: {donor.bloodType}
                            </span>
                            <StatusBadge status={donor.status} size="sm" />
                          </div>
                          <h3 className="text-base font-semibold text-on-surface truncate">
                            Listing #{donor.id} • Donor Age: {donor.donorAge || '32'}y ({donor.donorGender || 'M'})
                          </h3>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">
                            HLA: A*({donor.hlaTyping.a.join(',')}), B*({donor.hlaTyping.b.join(',')}), DR*({donor.hlaTyping.dr.join(',')})
                          </p>
                        </div>
                      </div>

                      {/* Right: Viability clock & Find Matches Button */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                        {donor.viabilityDeadline && (
                          <CountdownTimer targetDate={donor.viabilityDeadline} label="Cold Ischemia Cutoff" size="sm" />
                        )}
                        <Link
                          href={`/listings/${donor.id}/matches`}
                          className="bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                        >
                          Find Matches <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Panel: Recent Coordination Activity Timeline (4 cols) */}
          <section className="lg:col-span-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
              <p className="text-xs text-on-surface-variant">Live audit log across regional nodes</p>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-2xs">
              <ul className="relative space-y-5 before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-outline-variant/40">
                <li className="relative pl-7">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Kidney Dispatched (Green Corridor)</span>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Perfusion Box #X89 en route to City Med Hyderabad. Temp stable 3.8°C.
                    </p>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 font-medium">10 mins ago</span>
                  </div>
                </li>

                <li className="relative pl-7">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">handshake</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Liver Match Proposed</span>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Transmitted offer to St. Jude Institute for Patient #PT-STJ-7712.
                    </p>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 font-medium">25 mins ago</span>
                  </div>
                </li>

                <li className="relative pl-7">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">task_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Transplant Completed</span>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      Cornea surgical graft successful at Apollo Center. Match closed.
                    </p>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 font-medium">Yesterday</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </RoleGuard>
  );
}
