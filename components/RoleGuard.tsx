'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'HOSPITAL_USER' | 'ADMIN';
  requireVerifiedHospital?: boolean;
}

export default function RoleGuard({
  children,
  requiredRole = 'HOSPITAL_USER',
  requireVerifiedHospital = true
}: RoleGuardProps) {
  const { currentRole, currentHospital, logout, isLoaded } = usePlatform();

  // Block rendering until session & JWT state hydration is complete
  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
          Verifying Credentials...
        </span>
      </div>
    );
  }

  // If page requires Admin and current user is Hospital User
  if (requiredRole === 'ADMIN' && currentRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface-container rounded-2xl border border-outline-variant/30 text-center shadow-sm">
        <span className="material-symbols-outlined text-error text-[48px] mb-4">gpp_bad</span>
        <h2 className="text-2xl font-semibold mb-2">NOTTO Admin Desk Restricted</h2>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          Access to the National Accreditation Queue & Governance Desk requires NOTTO Administrator credentials.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full shadow-xs transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span> Return to Hospital Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If page requires Hospital User and current user is Admin
  if (requiredRole === 'HOSPITAL_USER' && currentRole === 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface-container rounded-2xl border border-outline-variant/30 text-center shadow-sm">
        <span className="material-symbols-outlined text-tertiary text-[48px] mb-4">admin_panel_settings</span>
        <h2 className="text-2xl font-semibold mb-2">NOTTO Administrative Mode Active</h2>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          You are currently logged in as a National Governance Administrator. Please use your Verification Queue desk to inspect and accredit registered hospitals.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/admin/queue"
            className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span> Open Verification Queue
          </Link>
        </div>
      </div>
    );
  }

  // Check hospital verification status
  if (requiredRole === 'HOSPITAL_USER' && requireVerifiedHospital) {
    if (!currentHospital) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center shadow-sm">
          <span className="material-symbols-outlined text-outline text-[48px] mb-3">domain_disabled</span>
          <h2 className="text-xl font-semibold mb-2">No Hospital Associated</h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Please register your hospital account to access organ matching features.
          </p>
          <Link
            href="/register"
            className="bg-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full inline-block"
          >
            Register Hospital Application
          </Link>
        </div>
      );
    }

    if (currentHospital.status === 'PENDING_REVIEW') {
      return (
        <div className="max-w-lg mx-auto my-12 p-8 bg-surface-container-lowest rounded-2xl border border-secondary-container text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">hourglass_empty</span>
          </div>
          <span className="inline-block bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Registration Under Review
          </span>
          <h2 className="text-2xl font-semibold text-on-surface mb-2">{currentHospital.name}</h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            Your hospital application is undergoing accreditation review by NOTTO compliance officers. Clinical matching and organ listings remain locked until approved.
          </p>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Application Reference:</span>
              <span className="font-semibold text-on-surface font-mono">#{currentHospital.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Verification SLA:</span>
              <span className="font-semibold text-secondary">Under 24 Hours</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => logout && logout()}
              className="bg-surface-container-high hover:bg-surface-dim text-on-surface font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span> Sign Out
            </button>
          </div>
        </div>
      );
    }

    if (currentHospital.status === 'REJECTED') {
      return (
        <div className="max-w-lg mx-auto my-12 p-8 bg-surface-container-lowest rounded-2xl border border-error-container text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-error">cancel</span>
          </div>
          <span className="inline-block bg-error-container text-on-error-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Registration Rejected
          </span>
          <h2 className="text-2xl font-semibold text-on-surface mb-2">{currentHospital.name}</h2>
          <div className="p-4 bg-error-container/40 rounded-xl border border-error/20 text-left text-xs mb-6 space-y-2">
            <span className="font-bold text-error uppercase tracking-wider text-[10px]">Reason for Rejection</span>
            <p className="text-on-surface leading-relaxed">{currentHospital.rejectionReason}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/register"
              className="bg-primary text-on-primary font-semibold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all"
            >
              Submit Revised Application
            </Link>
            <button
              onClick={() => logout && logout()}
              className="bg-surface-container-high text-on-surface font-semibold text-xs px-5 py-2.5 rounded-full"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
