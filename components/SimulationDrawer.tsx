'use client';

import React, { useState } from 'react';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function SimulationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    simulateIncomingMatchProposal,
    simulateAdvanceTime,
    simulateTriggerViabilityAlert,
    resetAllData,
    simulatedTimeOffsetMinutes,
    currentRole,
    currentHospitalId,
    setCurrentRole,
    setCurrentHospitalId
  } = usePlatform();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {isOpen ? (
        <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl border border-outline-variant/40 max-w-md w-full animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-outline/30 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-inverse-primary text-[20px]">science</span>
              <span className="text-xs font-bold uppercase tracking-wider text-inverse-primary">
                Hackathon Simulation & Demo Controls
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-inverse-on-surface hover:text-white p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <p className="text-[11px] opacity-80 mb-3 leading-relaxed">
            Use these controls to fast-forward countdown clocks, simulate incoming proposals, and test all critical workflow states without waiting.
          </p>

          <div className="space-y-3 text-xs">
            {/* Quick Role Switcher */}
            <div>
              <span className="text-[10px] uppercase font-bold text-outline-variant block mb-1.5">
                Active Perspective
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setCurrentRole('HOSPITAL_USER');
                    setCurrentHospitalId('hosp-metro-gen');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors truncate ${
                    currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-metro-gen'
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  🏥 Metro Gen (Donor)
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('HOSPITAL_USER');
                    setCurrentHospitalId('hosp-st-jude');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors truncate ${
                    currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-st-jude'
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  ❤️ St. Jude (Recipient)
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('ADMIN');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors truncate ${
                    currentRole === 'ADMIN'
                      ? 'bg-tertiary text-white font-semibold'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  ⚖️ NOTTO Admin Desk
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('HOSPITAL_USER');
                    setCurrentHospitalId('hosp-hope-center');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left transition-colors truncate ${
                    currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-hope-center'
                      ? 'bg-secondary text-white font-semibold'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  🔒 Pending Hospital
                </button>
              </div>
            </div>

            {/* Simulated Fast Forward */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] uppercase font-bold text-outline-variant">
                  Clock Offset: +{simulatedTimeOffsetMinutes} mins
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => simulateAdvanceTime(15)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 px-2 rounded-lg font-medium text-center transition-colors"
                >
                  +15 Mins
                </button>
                <button
                  onClick={() => simulateAdvanceTime(45)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 px-2 rounded-lg font-medium text-center transition-colors"
                >
                  +45 Mins (Timeout)
                </button>
                <button
                  onClick={() => simulateAdvanceTime(180)}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-1.5 px-2 rounded-lg font-medium text-center transition-colors"
                >
                  +3 Hours
                </button>
              </div>
            </div>

            {/* Simulated Events */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-outline-variant block">
                Instant Triggers
              </span>
              <button
                onClick={simulateIncomingMatchProposal}
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-1.5 px-3 rounded-lg text-left flex items-center justify-between transition-colors"
              >
                <span>Simulate Incoming Match Proposal</span>
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              </button>
              <button
                onClick={simulateTriggerViabilityAlert}
                className="w-full bg-error hover:bg-error/90 text-white font-medium py-1.5 px-3 rounded-lg text-left flex items-center justify-between transition-colors"
              >
                <span>Simulate Viability Expiry Alert</span>
                <span className="material-symbols-outlined text-[16px]">warning</span>
              </button>
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-outline/30 flex justify-between items-center">
              <button
                onClick={resetAllData}
                className="text-red-300 hover:text-red-200 text-xs font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset All Mock Data
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white text-xs"
              >
                Hide Panel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-inverse-surface hover:bg-black text-inverse-on-surface px-3.5 py-2 rounded-full shadow-lg border border-outline-variant/40 text-xs font-semibold flex items-center gap-2 transition-transform hover:scale-105"
        >
          <span className="material-symbols-outlined text-inverse-primary text-[18px]">science</span>
          <span>Simulation Controls</span>
          {simulatedTimeOffsetMinutes > 0 && (
            <span className="px-1.5 py-0.2 bg-primary text-[10px] rounded-full">
              +{simulatedTimeOffsetMinutes}m
            </span>
          )}
        </button>
      )}
    </div>
  );
}
