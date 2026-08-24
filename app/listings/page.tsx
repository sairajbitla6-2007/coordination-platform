'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import StatusBadge from '@/components/StatusBadge';
import CountdownTimer from '@/components/CountdownTimer';
import { ListingStatus, ListingType } from '@/lib/types';

export default function MyListingsPage() {
  const { listings, currentHospitalId } = usePlatform();

  const [typeFilter, setTypeFilter] = useState<'ALL' | ListingType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ListingStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Hospital-filtered listings
  const hospitalListings = listings.filter(l => l.hospitalId === currentHospitalId);

  const filteredListings = hospitalListings.filter(listing => {
    if (typeFilter !== 'ALL' && listing.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && listing.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = listing.id.toLowerCase().includes(q);
      const matchOrgan = listing.organType.toLowerCase().includes(q);
      const matchBlood = listing.bloodType.toLowerCase().includes(q);
      const matchPatient = listing.recipientPatientId?.toLowerCase().includes(q);
      return matchId || matchOrgan || matchBlood || matchPatient;
    }
    return true;
  });

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Registry Management
              </span>
              <span className="text-xs text-on-surface-variant">• {hospitalListings.length} Total Listings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              Hospital Organ & Patient Listings
            </h1>
          </div>
          <Link
            href="/listings/new"
            className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add New Listing
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 shadow-2xs space-y-4">
          {/* Top Bar: Search and Type Switcher */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by organ, blood type, listing ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              )}
            </div>

            {/* Type Segment Control (ALL / DONORS / RECIPIENTS) */}
            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30 text-xs font-semibold shrink-0">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  typeFilter === 'ALL'
                    ? 'bg-surface-container-lowest text-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({hospitalListings.length})
              </button>
              <button
                onClick={() => setTypeFilter('DONOR')}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  typeFilter === 'DONOR'
                    ? 'bg-surface-container-lowest text-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">volunteer_activism</span>
                Donors ({hospitalListings.filter(l => l.type === 'DONOR').length})
              </button>
              <button
                onClick={() => setTypeFilter('RECIPIENT')}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  typeFilter === 'RECIPIENT'
                    ? 'bg-surface-container-lowest text-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">inbox</span>
                Recipients ({hospitalListings.filter(l => l.type === 'RECIPIENT').length})
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">
              Status:
            </span>
            {(['ALL', 'ACTIVE', 'PENDING_MATCH', 'MATCHED', 'EXPIRED', 'COMPLETED'] as const).map(st => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                      : 'bg-surface-container hover:bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listings Cards List */}
        {filteredListings.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-outline text-[48px]">search_off</span>
            <h3 className="text-base font-semibold text-on-surface">No Listings Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              No hospital records match the current filter criteria. Try clearing filters or create a new listing.
            </p>
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map(listing => {
              const isDonor = listing.type === 'DONOR';

              return (
                <div
                  key={listing.id}
                  className={`bg-surface-container-lowest rounded-2xl p-5 border transition-all shadow-2xs hover:shadow-md ${
                    listing.status === 'EXPIRED'
                      ? 'border-outline/20 opacity-70 bg-surface-dim/30'
                      : listing.status === 'PENDING_MATCH'
                      ? 'border-secondary/40 bg-secondary-container/10'
                      : 'border-outline-variant/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Organ Badge + Primary Details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          isDonor ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[30px]">
                          {listing.organType === 'Heart'
                            ? 'favorite'
                            : listing.organType === 'Kidney'
                            ? 'grain'
                            : listing.organType === 'Liver'
                            ? 'medication'
                            : listing.organType === 'Lung'
                            ? 'air'
                            : 'vital_signs'}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold bg-surface-container-high text-on-surface px-2.5 py-0.5 rounded-md">
                            {listing.organType.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold bg-primary-fixed/40 text-on-primary-fixed-variant px-2.5 py-0.5 rounded-md">
                            Blood {listing.bloodType}
                          </span>
                          <StatusBadge status={listing.status} size="sm" />
                          {listing.urgencyLevel && (
                            <StatusBadge status={listing.urgencyLevel} size="sm" />
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold text-on-surface flex items-center gap-2">
                          <span>Listing #{listing.id}</span>
                          <span className="text-xs font-normal text-on-surface-variant">
                            • {isDonor ? `Donor Age: ${listing.donorAge || '30'}y (${listing.donorGender || 'M'})` : `Patient ID: ${listing.recipientPatientId}`}
                          </span>
                        </h3>

                        <div className="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                          <span>
                            HLA Typing: A*({listing.hlaTyping.a.join(',')}) B*({listing.hlaTyping.b.join(',')}) DR*({listing.hlaTyping.dr.join(',')})
                          </span>
                          {listing.conditionNotes && (
                            <span className="font-sans italic truncate max-w-md">
                              "{listing.conditionNotes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timing / Deadlines & Action Triggers */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-outline-variant/20 shrink-0">
                      {isDonor && listing.viabilityDeadline && (
                        <CountdownTimer
                          targetDate={listing.viabilityDeadline}
                          label="Viability Deadline"
                          size="sm"
                        />
                      )}

                      {!isDonor && listing.waitingSince && (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                            Waiting Duration
                          </span>
                          <span className="text-xs font-semibold text-on-surface tabular-nums">
                            {Math.floor((Date.now() - new Date(listing.waitingSince).getTime()) / (1000 * 60 * 60 * 24))} Days on Registry
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {listing.status === 'ACTIVE' && (
                          <Link
                            href={`/listings/${listing.id}/matches`}
                            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">radar</span>
                            Find Matches
                          </Link>
                        )}

                        {listing.status === 'PENDING_MATCH' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary-container/50 text-on-secondary-container text-xs font-semibold">
                            <span className="material-symbols-outlined text-[16px]">lock</span>
                            Locked in Proposal
                          </span>
                        )}

                        {listing.status === 'MATCHED' && (
                          <Link
                            href="/transport/MATCH-CONF-002"
                            className="bg-secondary hover:bg-secondary/90 text-on-secondary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                            Track Transport
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
