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
  const { currentRole, currentHospital, setCurrentRole, setCurrentHospitalId } = usePlatform();

  // If page requires Admin and current user is Hospital User
  if (requiredRole === 'ADMIN' && currentRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface-container rounded-2xl border border-outline-variant/30 text-center shadow-sm">
        <span className="material-symbols-outlined text-tertiary text-[48px] mb-4">admin_panel_settings</span>
        <h2 className="text-2xl font-semibold mb-2">NOTTO Admin Desk Access Required</h2>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          You are currently viewing as a Hospital Coordinator. Switch your active session to Platform Admin to manage accreditation queues.
        </p>
        <button
          onClick={() => setCurrentRole('ADMIN')}
          className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full shadow-xs transition-all inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">switch_account</span> Switch to NOTTO Admin
        </button>
      </div>
    );
  }

  // If page requires Hospital User and current user is Admin
  if (requiredRole === 'HOSPITAL_USER' && currentRole === 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface-container rounded-2xl border border-outline-variant/30 text-center shadow-sm">
        <span className="material-symbols-outlined text-primary text-[48px] mb-4">local_hospital</span>
        <h2 className="text-2xl font-semibold mb-2">Hospital Operational Area</h2>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
          You are currently in NOTTO Administrative mode. Switch to a verified hospital to view clinical dashboards, organ listings, and active transport streams.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setCurrentRole('HOSPITAL_USER');
              setCurrentHospitalId('hosp-metro-gen');
            }}
            className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm px-5 py-2 rounded-full shadow-xs transition-all"
          >
            Switch to Metro General Hospital
          </button>
          <Link
            href="/admin/queue"
            className="bg-surface-container-highest hover:bg-surface-dim text-on-surface font-semibold text-sm px-5 py-2 rounded-full transition-all"
          >
            Go to Admin Queue
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
          <h2 className="text-xl font-semibold mb-2">No Active Hospital Selected</h2>
          <p className="text-on-surface-variant text-sm mb-6">
            Please register your hospital or select a demo hospital profile.
          </p>
          <Link
            href="/register"
            className="bg-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-full inline-block"
          >
            Register Hospital
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
            Your hospital registration application (Ref: #{currentHospital.licenseNumber}) is undergoing compliance verification by NOTTO. Clinical matching and donor listings are locked until approval.
          </p>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Application Date:</span>
              <span className="font-semibold text-on-surface">Aug 20, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Transplant Admin:</span>
              <span className="font-semibold text-on-surface">{currentHospital.adminContact.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Verification Desk:</span>
              <span className="font-semibold text-secondary">NOTTO State Authorization Cell</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setCurrentHospitalId('hosp-metro-gen');
              }}
              className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all"
            >
              Switch to Verified Demo Hospital
            </button>
            <button
              onClick={() => setCurrentRole('ADMIN')}
              className="bg-surface-container-high hover:bg-surface-dim text-on-surface font-semibold text-xs px-5 py-2.5 rounded-full transition-all"
            >
              Open as Admin to Approve
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-primary text-on-primary font-semibold text-xs px-5 py-2.5 rounded-full shadow-xs transition-all"
            >
              Submit Revised Application
            </Link>
            <button
              onClick={() => setCurrentHospitalId('hosp-metro-gen')}
              className="bg-surface-container-high text-on-surface font-semibold text-xs px-5 py-2.5 rounded-full"
            >
              Switch to Metro General
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
