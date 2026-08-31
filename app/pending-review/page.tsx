'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function PendingReviewPage() {
  const router = useRouter();
  const { currentHospital, logout, showToast } = usePlatform();

  // Auto-detect NOTTO Admin verification approval in real-time and transition to dashboard
  useEffect(() => {
    if (currentHospital?.status === 'VERIFIED') {
      showToast({
        type: 'success',
        title: 'Accreditation Approved!',
        message: 'NOTTO Administrator has verified your facility. Opening Hospital Coordination Portal...'
      });
      router.push('/dashboard');
    }
  }, [currentHospital?.status, router, showToast]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-surface-container-low rounded-3xl p-8 sm:p-10 text-center border border-outline-variant/30 shadow-lg relative overflow-hidden flex flex-col items-center">
        {/* Background Blur */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-secondary blur-2xl" />
        </div>

        {/* Hourglass Icon */}
        <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-[48px] text-primary">
            hourglass_top
          </span>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-md border border-outline-variant/30">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              verified_user
            </span>
          </div>
        </div>

        <span className="text-xs font-bold bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Status: Pending Compliance Review
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-3 tracking-tight">
          Registration Under Review
        </h1>

        <p className="text-xs sm:text-sm text-on-surface-variant mb-6 max-w-md leading-relaxed">
          NOTTO compliance officers are currently verifying the credentials and OT accreditation for{' '}
          <strong className="text-on-surface">{currentHospital?.name || 'your hospital'}</strong>.
        </p>

        {/* Hospital Application Summary Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 text-left text-xs mb-8 space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <span className="text-on-surface-variant font-medium">Application Reference:</span>
            <span className="font-mono font-bold text-on-surface">{currentHospital?.licenseNumber || 'NOTTO-APPL-2026'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Transplant Lead:</span>
            <span className="font-semibold text-on-surface">{currentHospital?.adminContact.name || 'Coordinator'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Facility Type:</span>
            <span className="font-semibold text-primary">Level 1 Transplant Center</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Expected Verification SLA:</span>
            <span className="font-semibold text-on-surface">Under 24 Hours</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => logout && logout()}
            className="w-full bg-surface-container-high hover:bg-surface-dim text-on-surface font-semibold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out of Account
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>Encrypted Healthcare Coordination Environment</span>
        </div>
      </div>
    </div>
  );
}
