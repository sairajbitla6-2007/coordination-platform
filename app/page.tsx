'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePlatform, JWT_KEY } from '@/lib/context/PlatformContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Auto-login seeded demo credentials when switching perspectives
async function loginAs(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const token = data?.data?.access_token;
    if (token) {
      localStorage.setItem(JWT_KEY, token);
      return true;
    }
  } catch { /* backend offline — demo mode continues */ }
  return false;
}

export default function HomePage() {
  const { listings, hospitals, matches, transports, setCurrentRole, setCurrentHospitalId } = usePlatform();


  const activeDonorCount = listings.filter(l => l.type === 'DONOR' && l.status === 'ACTIVE').length;
  const activeRecipientCount = listings.filter(l => l.type === 'RECIPIENT' && l.status === 'ACTIVE').length;
  const inTransitCount = transports.filter(t => t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED').length;
  const completedMatchesCount = matches.filter(m => m.status === 'COMPLETED').length + 48; // simulated aggregate

  return (
    <div className="flex flex-col w-full -mt-16">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-surface-container pb-20 pt-28 md:pb-32 md:pt-36 lg:pb-36 lg:pt-40 border-b border-outline-variant/30">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.75" className="text-primary/30" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-container/50 to-surface-container" />
        </div>

        {/* Soft Ambient Radial Glows */}
        <div className="absolute -left-[10%] -top-[15%] z-0 h-[500px] w-[500px] rounded-full bg-primary-fixed/25 blur-[120px] pointer-events-none" />
        <div className="absolute -right-[10%] top-[30%] z-0 h-[400px] w-[400px] rounded-full bg-secondary-fixed/30 blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 md:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            NOTTO-Compliant Real-Time National Network
          </div>

          <h1 className="font-semibold text-3xl sm:text-5xl lg:text-6xl text-on-surface mb-6 max-w-4xl tracking-tight leading-[1.15]">
            Bridging the Gap Between <span className="text-primary font-bold">Life</span> and{' '}
            <span className="text-secondary font-bold">Hope.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-on-surface-variant mb-10 max-w-2xl font-normal leading-relaxed">
            A high-precision organ donation matching and rapid transplant logistics coordination platform. Connecting verified hospital transplant teams in real time to reduce ischemic loss.
          </p>

          {/* Action CTAs */}
          <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              onClick={async () => {
                setCurrentRole('HOSPITAL_USER');
                setCurrentHospitalId('hosp-metro-gen');
                await loginAs('priya.sharma@metrogeneral.med.in', 'MetroDemo@2024');
              }}
              className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary-container text-on-primary px-8 py-3.5 font-semibold text-sm shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Enter Hospital Portal
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full bg-surface-container-highest hover:bg-surface-dim text-on-surface px-8 py-3.5 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Hospital Sign In
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface px-6 py-3.5 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[20px]">domain_add</span>
              Register
            </Link>
            <Link
              href="/admin/queue"
              onClick={async () => {
                setCurrentRole('ADMIN');
                await loginAs('admin@organlink.demo', 'AdminDemo@2024');
              }}
              className="w-full sm:w-auto rounded-full bg-tertiary/10 hover:bg-tertiary/20 text-tertiary px-6 py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-tertiary/20"
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              NOTTO Admin Desk
            </Link>
          </div>

          {/* Live Network Pulse Ticker */}
          <div className="mt-12 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 shadow-sm text-left">
            <div className="p-2">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Active Donors
              </span>
              <span className="text-2xl font-bold text-primary tabular-nums">{activeDonorCount} Organs</span>
            </div>
            <div className="p-2 border-l border-outline-variant/20">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Waiting Patients
              </span>
              <span className="text-2xl font-bold text-secondary tabular-nums">{activeRecipientCount} Registered</span>
            </div>
            <div className="p-2 border-l border-outline-variant/20">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                In Transit
              </span>
              <span className="text-2xl font-bold text-tertiary tabular-nums">{inTransitCount} Active</span>
            </div>
            <div className="p-2 border-l border-outline-variant/20">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Transplants
              </span>
              <span className="text-2xl font-bold text-on-surface tabular-nums">{completedMatchesCount} Completed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Start Role Grid */}
      <section className="w-full py-16 bg-surface border-b border-outline-variant/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-on-surface mb-2">Simulate LifeLink Workflows</h2>
            <p className="text-on-surface-variant text-sm max-w-xl mx-auto">
              Select any role below to experience end-to-end clinical matching, live response countdowns, and cold-chain logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Donor Hospital */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[28px]">volunteer_activism</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-primary-fixed/40 text-on-primary-fixed-variant px-2 py-0.5 rounded-md">
                    VERIFIED CENTER
                  </span>
                  <span className="text-xs text-on-surface-variant">Metro General</span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">Donor Coordinator Workflow</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  List donor organs with hard viability deadlines, run AI cross-matching, propose matches, and lock donor status.
                </p>
              </div>
              <Link
                href="/dashboard"
                onClick={async () => {
                  setCurrentRole('HOSPITAL_USER');
                  setCurrentHospitalId('hosp-metro-gen');
                  await loginAs('priya.sharma@metrogeneral.med.in', 'MetroDemo@2024');
                }}
                className="w-full bg-primary text-on-primary font-semibold text-xs py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors shadow-2xs"
              >
                Launch Metro Gen Dashboard <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Card 2: Recipient Hospital */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[28px]">inbox</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-md">
                    RECIPIENT CENTER
                  </span>
                  <span className="text-xs text-on-surface-variant">St. Jude Cardiac</span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">Match Proposal Response</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  View incoming donor organ offers, monitor 45-minute ticking response countdowns, confirm or decline match requests.
                </p>
              </div>
              <Link
                href="/requests"
                onClick={async () => {
                  setCurrentRole('HOSPITAL_USER');
                  setCurrentHospitalId('hosp-st-jude');
                  await loginAs('rajiv.menon@stjudeheart.org', 'StJudeDemo@2024');
                }}
                className="w-full bg-secondary text-on-secondary font-semibold text-xs py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 hover:bg-secondary/90 transition-colors shadow-2xs"
              >
                View Incoming Requests <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Card 3: NOTTO Admin */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[28px]">verified_user</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-tertiary-fixed/60 text-on-tertiary-fixed-variant px-2 py-0.5 rounded-md">
                    GOVERNANCE
                  </span>
                  <span className="text-xs text-on-surface-variant">NOTTO Admin Desk</span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">Accreditation Desk</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Audit hospital license documents, inspect OT certifications, approve verified centers or reject with justification.
                </p>
              </div>
              <Link
                href="/admin/queue"
                onClick={async () => {
                  setCurrentRole('ADMIN');
                  await loginAs('admin@organlink.demo', 'AdminDemo@2024');
                }}
                className="w-full bg-tertiary text-on-tertiary font-semibold text-xs py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 hover:bg-tertiary/90 transition-colors shadow-2xs"
              >
                Open Admin Queue <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles & Workflow Section */}
      <section className="w-full py-16 md:py-24 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold text-on-surface mb-3">Clinical Precision in Every Second</h2>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Designed explicitly for high-stakes surgical coordination. Unambiguous status indicators, color+icon+label semantics, and zero cognitive friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mb-5 shadow-xs">
                <span className="material-symbols-outlined text-[30px]">biotech</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Automated Match Scoring</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Evaluates ABO blood compatibility, HLA loci (A, B, DR) antigen matching, transit feasibility, and waiting time priority in sub-seconds.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-5 shadow-xs">
                <span className="material-symbols-outlined text-[30px]">lock_clock</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Strict Viability Windows</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Enforces hard cold ischemia cutoffs (e.g. 4 hours for Hearts, 6 hours for Lungs) with live ticking countdowns and automated expiry alerts.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="w-14 h-14 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-5 shadow-xs">
                <span className="material-symbols-outlined text-[30px]">thermostat</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Cold-Chain GPS Telemetry</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Tracks green corridor ambulances and medical charters in real time with continuous perfusion temperature (2–6°C) and battery telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-surface-container border-t border-outline-variant/30 py-8 text-center text-xs text-on-surface-variant">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">favorite</span>
            <span className="font-semibold text-on-surface">LifeLink National Transplant Platform</span>
          </div>
          <p>© 2026 National Organ & Tissue Transplant Organization (NOTTO) Standards Demo</p>
        </div>
      </footer>
    </div>
  );
}
