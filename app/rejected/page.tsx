'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function RegistrationRejectedPage() {
  const { currentHospital, setCurrentHospitalId } = usePlatform();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-8 sm:p-10 text-center border border-error-container shadow-xl space-y-6">
        <div className="w-20 h-20 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[42px] text-error">cancel</span>
        </div>

        <div>
          <span className="inline-block bg-error-container text-on-error-container text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Application Status: Rejected
          </span>
          <h1 className="text-2xl font-bold text-on-surface">
            {currentHospital?.name || 'Hospital Application Rejected'}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Ref: {currentHospital?.licenseNumber || 'NOTTO-APPL-2026'}
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-5 bg-error-container/30 rounded-2xl border border-error/20 text-left text-xs space-y-2">
          <span className="font-bold text-error uppercase tracking-wider text-[11px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">info</span>
            NOTTO Audit Findings & Rejection Justification
          </span>
          <p className="text-on-surface leading-relaxed">
            {currentHospital?.rejectionReason ||
              'Inadequate modular OT facility for cold preservation retrieval. Facility is not certified as a Level-1 organ recovery or surgical transplant center under NOTTO guidelines.'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/register"
            className="w-full bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Submit Revised Application with Updated Documents
          </Link>
          <button
            onClick={() => setCurrentHospitalId('hosp-metro-gen')}
            className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            Switch to Verified Demo Hospital (Metro General)
          </button>
        </div>
      </div>
    </div>
  );
}
