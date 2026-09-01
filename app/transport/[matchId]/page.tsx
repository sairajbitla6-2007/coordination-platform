'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import StatusBadge from '@/components/StatusBadge';
import { TransportStatus } from '@/lib/types';

export default function TransportTrackingPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const { transports, getTransportByMatchId, advanceTransportStatus, currentHospitalId } = usePlatform();

  const transport = getTransportByMatchId(matchId) || transports[0];
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!transport) {
    return (
      <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
        <div className="max-w-md mx-auto my-16 p-8 bg-surface-container-low rounded-2xl text-center border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[48px] mb-2">local_shipping</span>
          <h2 className="text-lg font-semibold text-on-surface">No Active Transport Record</h2>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            Transport is initialized when a match proposal is confirmed by the receiving center.
          </p>
          <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline">
            ← Return to Dashboard
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const match = transport.match;
  const donor = match.donorListing;
  const recipient = match.recipientListing;

  const stepMap: Record<string, number> = {
    PENDING: 0,
    DISPATCHED: 1,
    IN_TRANSIT: 2,
    DELIVERED: 3
  };
  const currentStepIndex = stepMap[transport.status] ?? 0;

  const handleAdvance = (next: TransportStatus) => {
    setIsUpdating(true);
    setTimeout(() => {
      advanceTransportStatus(transport.matchId, next);
      setIsUpdating(false);
      if (next === 'DELIVERED') {
        setTimeout(() => {
          router.push('/history');
        }, 1200);
      }
    }, 400);
  };

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Logistics</span>
              <span>/</span>
              <span>Tracking #{transport.trackingNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight flex items-center gap-3">
              <span>Live Transport Telemetry</span>
              <StatusBadge status={transport.status} size="sm" />
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-outline-variant/30 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              Match History
            </Link>
          </div>
        </div>

        {/* Top Hero: Live ETA & Status Tracker */}
        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
          {/* Ambient pulse */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
            <div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Estimated Transit Time
              </span>
              <div className="flex items-baseline gap-2 text-primary">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                  {transport.status === 'DELIVERED' ? '0' : transport.etaMinutes}
                </span>
                <span className="text-xl font-semibold text-on-surface">Minutes Remaining</span>
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                Origin: {match.proposingHospitalName} → Dest: {match.receivingHospitalName}
              </span>
            </div>

            {/* Live Telemetry Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-primary text-[18px]">thermostat</span>
                <span>Box Temp: <strong>{transport.currentTemperature}°C</strong> (2-6°C Target)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">battery_charging_full</span>
                <span>Perfusion Battery: <strong>{transport.batteryLevel}%</strong></span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-tertiary text-[18px]">speed</span>
                <span>Ground Speed: <strong>{transport.gpsSpeedKmH} km/h</strong></span>
              </div>
            </div>
          </div>

          {/* 4-Step Milestone Stepper */}
          <div className="pt-6">
            <div className="relative">
              {/* Progress Track Line */}
              <div className="absolute top-4 left-0 w-full h-1 bg-surface-variant rounded-full" />
              <div
                className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(currentStepIndex / 3) * 100}%` }}
              />

              <div className="flex justify-between relative">
                {[
                  { key: 'PENDING', label: '1. Awaiting Dispatch', desc: 'Box QA Sealing', icon: 'pending' },
                  { key: 'DISPATCHED', label: '2. Dispatched', desc: 'Ambulance Bay', icon: 'inventory' },
                  { key: 'IN_TRANSIT', label: '3. In Transit', desc: 'Green Corridor Route', icon: 'local_shipping' },
                  { key: 'DELIVERED', label: '4. Delivered', desc: 'Transplant OT Handoff', icon: 'verified' }
                ].map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center w-1/4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-surface-container-low transition-all shadow-xs ${
                          isCurrent
                            ? 'bg-primary text-on-primary ring-primary/30 scale-110'
                            : isCompleted
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold mt-2.5 leading-tight ${
                          isCompleted ? 'text-on-surface' : 'text-on-surface-variant'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/80 hidden sm:block mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live GPS Map Simulation Container & Telemetry split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Simulated Route Map (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 shadow-2xs">
            {/* Visual Simulated Route Card */}
            <div className="relative h-96 sm:h-[420px] w-full bg-gradient-to-b from-[#0c181a] via-[#112427] to-[#0c181a] flex flex-col justify-between p-4 sm:p-5 text-white overflow-hidden select-none border-b border-outline-variant/30">
              {/* Route Map Graphic & Radar Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 400">
                  {/* Grid Lines */}
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="0" y1="200" x2="1000" y2="200" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="0" y1="300" x2="1000" y2="300" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="250" y1="0" x2="250" y2="400" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="500" y1="0" x2="500" y2="400" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  <line x1="750" y1="0" x2="750" y2="400" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                  
                  {/* Glowing Route Arc Path */}
                  <path
                    d="M 120 280 Q 480 80, 860 120"
                    fill="none"
                    stroke="#00685f"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <path
                    d="M 120 280 Q 480 80, 860 120"
                    fill="none"
                    stroke="#89f5e7"
                    strokeWidth="3.5"
                    strokeDasharray="8,8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Layer 1: Top Bar Overlays */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-2.5">
                <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-primary/40 shadow-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-fixed"></span>
                  </span>
                  <span className="text-primary-fixed text-[11px] sm:text-xs font-semibold tracking-wide">
                    Active Green Corridor Cleared by State Traffic Police
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-mono border border-outline-variant/30 text-white/90 flex items-center gap-1.5 shadow-md">
                    <span className="material-symbols-outlined text-[15px] text-primary">navigation</span>
                    <span>GPS: 13.0827° N, 80.2707° E</span>
                  </div>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white hover:text-primary-fixed flex items-center justify-center border border-outline-variant/30 transition-colors shadow-md group"
                    title="Expand Fullscreen Map"
                    aria-label="Expand Fullscreen Map"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                      fullscreen
                    </span>
                  </button>
                </div>
              </div>

              {/* Layer 2: Center Waypoints and Moving Vehicle */}
              <div className="relative flex-1 w-full my-2 min-h-[190px]">
                {/* Origin Waypoint Pin (Bottom-Left) */}
                <div className="absolute left-[2%] sm:left-[5%] bottom-[10%] z-10 flex items-center gap-2.5 max-w-[200px] sm:max-w-[240px]">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg ring-2 ring-white/80 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                  </div>
                  <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-outline-variant/30 shadow-md min-w-0">
                    <span className="text-[9px] font-bold text-primary-fixed uppercase tracking-wider block leading-none mb-0.5">
                      Origin Hub
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-white truncate block">
                      {match.proposingHospitalName}
                    </span>
                  </div>
                </div>

                {/* Destination Waypoint Pin (Top-Right) */}
                <div className="absolute right-[2%] sm:right-[5%] top-[10%] z-10 flex items-center justify-end gap-2.5 max-w-[200px] sm:max-w-[240px] text-right">
                  <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-outline-variant/30 shadow-md min-w-0">
                    <span className="text-[9px] font-bold text-secondary-fixed uppercase tracking-wider block leading-none mb-0.5">
                      Destination Hub
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-white truncate block">
                      {match.receivingHospitalName}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg ring-2 ring-white/80 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                  </div>
                </div>

                {/* Moving Vehicle & Perfusion Box Marker (Interpolated Safely on Route) */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 ease-out"
                  style={{
                    left: `${[20, 38, 58, 78][currentStepIndex]}%`,
                    top: `${[66, 54, 44, 36][currentStepIndex]}%`
                  }}
                >
                  <div className="bg-primary text-on-primary px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-2xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap mb-1 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>{transport.preservationBoxId}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl ring-4 ring-primary/50">
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">local_shipping</span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Bottom Dock Bar (Telemetry & Personnel) */}
              <div className="relative z-20 mt-auto bg-black/80 backdrop-blur-md rounded-2xl p-3 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-primary-fixed text-[18px] shrink-0">directions_car</span>
                  <span className="text-white/80">Vehicle:</span>
                  <strong className="text-white font-bold truncate">
                    {transport.transportVehicle.replace(/_/g, ' ')}
                  </strong>
                </div>
                <div className="flex items-center gap-2 min-w-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <span className="material-symbols-outlined text-secondary-fixed text-[18px] shrink-0">person</span>
                  <span className="text-white/80">Pilot:</span>
                  <span className="text-white font-medium truncate">
                    {transport.driverContact.name} ({transport.driverContact.phone})
                  </span>
                </div>
              </div>
            </div>

            {/* Fullscreen Map Modal (Part B - Additive) */}
            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
                {/* Fullscreen Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          Live Green Corridor Transport Telemetry
                        </h2>
                        <StatusBadge status={transport.status} size="sm" />
                      </div>
                      <span className="text-xs text-white/60 font-mono">
                        Tracking #{transport.trackingNumber} • {match.donorListing.organType} Allocation
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="bg-surface-container hover:bg-surface-container-high text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold border border-outline-variant/30 transition-colors"
                    title="Exit Fullscreen"
                  >
                    <span className="material-symbols-outlined text-[18px]">fullscreen_exit</span>
                    <span>Exit Fullscreen</span>
                  </button>
                </div>

                {/* Expanded Fullscreen Map Viewport */}
                <div className="flex-1 w-full rounded-3xl relative overflow-hidden bg-gradient-to-b from-[#0c181a] via-[#112427] to-[#0c181a] border border-outline-variant/30 shadow-2xl flex flex-col justify-between p-6">
                  {/* Expanded Route Overlay */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1000 400">
                      <line x1="0" y1="100" x2="1000" y2="100" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                      <line x1="0" y1="200" x2="1000" y2="200" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                      <line x1="0" y1="300" x2="1000" y2="300" stroke="#89f5e7" strokeWidth="0.5" strokeDasharray="4,4" />
                      <path d="M 120 280 Q 480 80, 860 120" fill="none" stroke="#00685f" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
                      <path d="M 120 280 Q 480 80, 860 120" fill="none" stroke="#89f5e7" strokeWidth="4" strokeDasharray="8,8" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Top Status in Fullscreen */}
                  <div className="relative z-20 flex flex-wrap items-center justify-between gap-3">
                    <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2.5 border border-primary/40">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-fixed"></span>
                      </span>
                      <span className="text-primary-fixed text-xs font-semibold">
                        Active Green Corridor Cleared by State Traffic Police
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-mono border border-outline-variant/30 text-white/90 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">navigation</span>
                        <span>GPS: 13.0827° N, 80.2707° E</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-full text-xs border border-outline-variant/30 text-white/90 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-tertiary">speed</span>
                        <span>{transport.gpsSpeedKmH} km/h</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-full text-xs border border-outline-variant/30 text-white/90 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">thermostat</span>
                        <span>{transport.currentTemperature}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Waypoints in Fullscreen */}
                  <div className="relative flex-1 w-full my-4">
                    {/* Origin Pin */}
                    <div className="absolute left-[5%] bottom-[12%] z-10 flex items-center gap-3 max-w-[320px]">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl ring-4 ring-white/80 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                      </div>
                      <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-outline-variant/30 shadow-lg min-w-0">
                        <span className="text-[10px] font-bold text-primary-fixed uppercase tracking-wider block mb-0.5">
                          Origin Hub
                        </span>
                        <span className="text-sm font-semibold text-white truncate block">
                          {match.proposingHospitalName}
                        </span>
                      </div>
                    </div>

                    {/* Destination Pin */}
                    <div className="absolute right-[5%] top-[12%] z-10 flex items-center justify-end gap-3 max-w-[320px] text-right">
                      <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-outline-variant/30 shadow-lg min-w-0">
                        <span className="text-[10px] font-bold text-secondary-fixed uppercase tracking-wider block mb-0.5">
                          Destination Hub
                        </span>
                        <span className="text-sm font-semibold text-white truncate block">
                          {match.receivingHospitalName}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xl ring-4 ring-white/80 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">domain</span>
                      </div>
                    </div>

                    {/* Vehicle Marker */}
                    <div
                      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 ease-out"
                      style={{
                        left: `${[20, 38, 58, 78][currentStepIndex]}%`,
                        top: `${[66, 54, 44, 36][currentStepIndex]}%`
                      }}
                    >
                      <div className="bg-primary text-on-primary px-3.5 py-1 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap mb-1.5 border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>{transport.preservationBoxId}</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl ring-4 ring-primary/50">
                        <span className="material-symbols-outlined text-[26px]">local_shipping</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar in Fullscreen */}
                  <div className="relative z-20 bg-black/85 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-fixed text-[20px]">directions_car</span>
                      <span className="text-white/80">Vehicle:</span>
                      <strong className="text-white text-sm font-bold">
                        {transport.transportVehicle.replace(/_/g, ' ')}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary-fixed text-[20px]">person</span>
                      <span className="text-white/80">Lead Pilot:</span>
                      <span className="text-white text-sm font-medium">
                        {transport.driverContact.name} ({transport.driverContact.phone})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checkpoints Timeline */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Logistics Waypoint Verification Checkpoints
              </h3>
              <div className="space-y-3">
                {transport.checkpoints.map((cp, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        cp.completed
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {cp.completed ? 'check' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${cp.completed ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {cp.title}
                        </span>
                        {cp.timestamp && (
                          <span className="text-[10px] text-on-surface-variant font-mono">{cp.timestamp}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant">{cp.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Role-Gated Action Stepper & Organ Specs (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Action Box: Advance Stepper (Donor Center Only) or Live Recipient Monitor */}
            {isRecipientView ? (
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">radar</span>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Recipient Monitor Desk
                  </h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Live organ transit telemetry monitored in real-time. Dispatch and transit controls are managed by the Donor Center (<strong className="text-on-surface">{match.proposingHospitalName}</strong>).
                </p>

                <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant font-medium">Logistics Status:</span>
                    <StatusBadge status={transport.status} size="sm" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-medium">Perfusion Box ID:</span>
                    <span className="font-mono font-bold text-on-surface">{transport.preservationBoxId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-medium">Cold Storage Temp:</span>
                    <span className="font-mono font-bold text-primary tabular-nums">{transport.currentTemperature}°C</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant font-medium">Estimated Transit ETA:</span>
                    <span className="font-bold text-on-surface tabular-nums">{transport.etaMinutes} mins</span>
                  </div>
                </div>

                {transport.status === 'DELIVERED' ? (
                  <div className="p-3 bg-secondary-container/40 rounded-xl border border-secondary/30 text-center text-xs text-on-secondary-container">
                    <span className="material-symbols-outlined text-secondary text-[24px] block mb-1">task_alt</span>
                    <strong>Organ Received at Surgical Suite</strong>
                    <p className="text-[11px] mt-0.5">Recipient surgical team has received the graft for transplantation.</p>
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container-high/60 rounded-xl border border-outline-variant/30 text-center text-xs text-on-surface-variant flex items-center gap-2 justify-center">
                    <span className="material-symbols-outlined text-primary text-[18px] animate-spin">sync</span>
                    <span>Monitoring Live Telemetry Stream...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Logistics State Control
                  </h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Donor Center dispatch authority. Step progression updates live telemetry for recipient hospital ({match.receivingHospitalName}).
                </p>

                <div className="space-y-2 pt-1">
                  {transport.status === 'PENDING' && (
                    <button
                      onClick={() => handleAdvance('DISPATCHED')}
                      disabled={isUpdating}
                      className="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">inventory</span>
                      Sign-Off & Dispatch Organ
                    </button>
                  )}

                  {transport.status === 'DISPATCHED' && (
                    <button
                      onClick={() => handleAdvance('IN_TRANSIT')}
                      disabled={isUpdating}
                      className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                      Confirm In Transit (Highway)
                    </button>
                  )}

                  {transport.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleAdvance('DELIVERED')}
                      disabled={isUpdating}
                      className="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">done_all</span>
                      Confirm Delivery & OT Receipt
                    </button>
                  )}

                  {transport.status === 'DELIVERED' && (
                    <div className="p-3 bg-primary-fixed/30 rounded-xl border border-primary/20 text-center text-xs text-on-primary-fixed-variant">
                      <span className="material-symbols-outlined text-primary text-[24px] block mb-1">task_alt</span>
                      <strong>Organ Delivered & Accepted</strong>
                      <p className="text-[11px] mt-0.5">Match has successfully transitioned to COMPLETED.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Organ Card Summary */}
            <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-[20px]">medical_information</span>
                <span className="font-bold text-on-surface uppercase tracking-wider">Clinical Specs</span>
              </div>

              <div className="flex justify-between">
                <span className="text-on-surface-variant">Organ Type:</span>
                <strong className="text-on-surface font-semibold">{donor.organType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Blood Compatibility:</span>
                <strong className="text-primary font-semibold">Donor {donor.bloodType} → Rec {recipient.bloodType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Recipient Patient:</span>
                <strong className="text-on-surface font-semibold">#{recipient.recipientPatientId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Perfusion Protocol:</span>
                <strong className="text-on-surface font-semibold">Cold Storage (Hypothermic)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
