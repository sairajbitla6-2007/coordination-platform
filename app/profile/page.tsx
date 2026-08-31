'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const JWT_KEY = 'organlink_jwt_token';

export default function HospitalProfilePage() {
  const { currentHospital, currentHospitalId, hospitals, setCurrentHospitalId, setCurrentRole, showToast } = usePlatform();

  const [urgentAlertsEnabled, setUrgentAlertsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from backend on mount. Falls back silently if no JWT (demo mode).
  useEffect(() => {
    const token = localStorage.getItem(JWT_KEY);
    if (!token) return; // demo mode — leave defaults as-is

    fetch(`${API_BASE}/auth/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data?.preferences) {
          const p = data.data.preferences;
          setUrgentAlertsEnabled(Boolean(p.urgent_alerts));
          setSoundAlertsEnabled(Boolean(p.sound_alerts));
          setDigestEnabled(Boolean(p.digest));
        }
      })
      .catch(() => {/* network error — keep defaults */});
  }, []);

  const handleSavePreferences = useCallback(async () => {
    const token = localStorage.getItem(JWT_KEY);

    if (!token) {
      // Demo / unauthenticated mode — just show success toast (no backend call)
      showToast({
        type: 'success',
        title: 'Preferences Updated (Demo)',
        message: 'Login via the backend to persist preferences to the database.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          urgent_alerts: urgentAlertsEnabled,
          sound_alerts: soundAlertsEnabled,
          digest: digestEnabled,
        }),
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Preferences Saved',
          message: 'Critical match telemetry and push alerting thresholds saved to database.',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({
          type: 'error',
          title: 'Save Failed',
          message: err?.message || 'Could not save preferences. Please try again.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not reach the backend. Check that Flask is running on port 5000.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [urgentAlertsEnabled, soundAlertsEnabled, digestEnabled, showToast]);


  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={false}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Hospital Profile & Settings</span>
        </div>

        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm text-center relative overflow-hidden">
          <div className="relative w-24 h-24 mx-auto rounded-full bg-surface-container-high overflow-hidden shadow-sm flex items-center justify-center mb-4 ring-4 ring-primary/20">
            <img
              alt="Profile"
              src={currentHospital?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256'}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {currentHospital?.name}
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant flex items-center justify-center gap-1.5 mt-1">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>NOTTO Verified Level-1 Transplant Center • Ref #{currentHospital?.licenseNumber}</span>
          </p>

          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
              {currentHospital?.hospitalType.replace(/_/g, ' ')}
            </span>
            <span className="bg-surface-container text-on-surface font-medium px-3 py-1 rounded-full">
              {currentHospital?.city}, {currentHospital?.state}
            </span>
            <span className="bg-secondary/10 text-secondary font-semibold px-3 py-1 rounded-full">
              24/7 Rapid Logistics Node
            </span>
          </div>
        </div>

        {/* Section 1: Facility & Legal Details */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Facility Information & Accreditation
            </h2>
            <span className="text-[11px] text-on-surface-variant font-semibold">Active Cycle 2024-2029</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                License / Registration Number
              </span>
              <span className="text-sm font-mono font-bold text-on-surface">{currentHospital?.licenseNumber}</span>
            </div>

            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Transplant Director
              </span>
              <span className="text-sm font-semibold text-on-surface">{currentHospital?.adminContact.name}</span>
            </div>

            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 sm:col-span-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Physical Campus Address
              </span>
              <span className="text-xs font-medium text-on-surface">{currentHospital?.address}, {currentHospital?.city}, {currentHospital?.state} - {currentHospital?.pincode}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Quick Hospital Perspective Switcher for Testing */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Quick Perspective Switcher (Testing & Demo)
            </h2>
            <span className="text-[11px] text-on-surface-variant">Switch active hospital node</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hospitals.map(h => (
              <button
                key={h.id}
                onClick={() => {
                  setCurrentHospitalId(h.id);
                  setCurrentRole('HOSPITAL_USER');
                  showToast({
                    type: 'info',
                    title: 'Hospital Switched',
                    message: `Active session changed to ${h.name}`
                  });
                }}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  currentHospitalId === h.id
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border-outline-variant/30'
                }`}
              >
                <div className="font-bold truncate">{h.name}</div>
                <div className={`text-[10px] mt-0.5 ${currentHospitalId === h.id ? 'text-white/80' : 'text-on-surface-variant'}`}>
                  {h.city} • Status: {h.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Notification & Telemetry Preferences */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/20">
            Alert & Telemetry Preferences
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Urgent Viability Alerts</span>
                <span className="text-[11px] text-on-surface-variant">Instant push warnings when cold ischemia time is &lt; 60 mins</span>
              </div>
              <input
                type="checkbox"
                checked={urgentAlertsEnabled}
                onChange={e => setUrgentAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Sound Notifications for Proposals</span>
                <span className="text-[11px] text-on-surface-variant">Play clinical chime on incoming high-urgency match proposals</span>
              </div>
              <input
                type="checkbox"
                checked={soundAlertsEnabled}
                onChange={e => setSoundAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Daily Registry Digest</span>
                <span className="text-[11px] text-on-surface-variant">Daily morning summary of regional donor listings and waiting patient metrics</span>
              </div>
              <input
                type="checkbox"
                checked={digestEnabled}
                onChange={e => setDigestEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-2 px-5 rounded-full shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
