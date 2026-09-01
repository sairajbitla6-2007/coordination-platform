'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePlatform, JWT_KEY } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function HospitalProfilePage() {
  const { currentHospital, currentRole, showToast } = usePlatform();

  const [urgentAlertsEnabled, setUrgentAlertsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string>('');

  const isAdmin = currentRole === 'ADMIN';

  // Load preferences & avatar from backend or localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem('organlink_custom_avatar');
    if (savedAvatar) setCustomAvatar(savedAvatar);

    const token = localStorage.getItem(JWT_KEY);
    if (!token) return;

    fetch(`${API_BASE}/auth/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => (res.ok ? res.json() : null))
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'warning',
          title: 'File Too Large',
          message: 'Please choose an image under 5MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomAvatar(dataUrl);
        localStorage.setItem('organlink_custom_avatar', dataUrl);
        showToast({
          type: 'success',
          title: 'Profile Photo Updated',
          message: 'Your profile photo has been updated successfully.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = useCallback(async () => {
    const token = localStorage.getItem(JWT_KEY);

    if (!token) {
      showToast({
        type: 'warning',
        title: 'Please Sign In First',
        message: 'You need to log in to save settings.',
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
          title: 'Settings Saved',
          message: 'Your notification and alert preferences have been updated.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Unable to Save Settings',
          message: 'Something went wrong while saving. Please try again.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Issue',
        message: 'Unable to reach the server. Please check your connection and try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [urgentAlertsEnabled, soundAlertsEnabled, digestEnabled, showToast]);

  const activeAvatar = customAvatar || currentHospital?.avatarUrl;

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={false}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
          <Link href={isAdmin ? '/admin/queue' : '/dashboard'} className="hover:underline">
            {isAdmin ? 'Admin Queue' : 'Dashboard'}
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">
            {isAdmin ? 'Administrator Profile' : 'Hospital Profile & Settings'}
          </span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm text-center relative overflow-hidden">
          {/* Avatar Upload Container */}
          <div className="relative w-24 h-24 mx-auto rounded-full bg-primary/10 overflow-hidden shadow-sm flex items-center justify-center mb-4 ring-4 ring-primary/20 group">
            {activeAvatar ? (
              <img alt="Profile" src={activeAvatar} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-primary-container/30 text-primary">
                <span className="material-symbols-outlined text-[48px]">
                  {isAdmin ? 'admin_panel_settings' : 'domain'}
                </span>
              </div>
            )}

            {/* Photo Upload Overlay */}
            <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[10px] font-semibold">
              <span className="material-symbols-outlined text-[20px] mb-0.5">photo_camera</span>
              <span>Upload Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {isAdmin ? 'Platform Admin (Governance Desk)' : currentHospital?.name || 'Registered Facility'}
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant flex items-center justify-center gap-1.5 mt-1">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>
              {isAdmin
                ? 'National Governance & Accreditation Desk'
                : `Verified Center • Reg #${currentHospital?.licenseNumber || 'REG-2026'}`}
            </span>
          </p>

          <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
              {isAdmin ? 'SUPER ADMINISTRATOR' : currentHospital?.hospitalType?.replace(/_/g, ' ') || 'TRANSPLANT CENTER'}
            </span>
            <span className="bg-surface-container text-on-surface font-medium px-3 py-1 rounded-full">
              {isAdmin ? 'New Delhi Headquarters' : `${currentHospital?.city || 'Bengaluru'}, ${currentHospital?.state || 'Karnataka'}`}
            </span>
            <span className="bg-secondary/10 text-secondary font-semibold px-3 py-1 rounded-full">
              {isAdmin ? 'Full Network Access' : 'Verified Node'}
            </span>
          </div>
        </div>

        {/* Section 1: Facility / User Details */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              {isAdmin ? 'Administrator Credentials & Identity' : 'Hospital & Registration Info'}
            </h2>
            <span className="text-[11px] text-on-surface-variant font-semibold">
              {isAdmin ? 'Active System Role' : 'Active Accreditation'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                {isAdmin ? 'Official Email' : 'Registration Number'}
              </span>
              <span className="text-sm font-mono font-bold text-on-surface">
                {isAdmin ? 'admin@organlink.demo' : currentHospital?.licenseNumber || 'REG-2026'}
              </span>
            </div>

            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                {isAdmin ? 'Designation' : 'Transplant Contact Person'}
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {isAdmin ? 'National Governance Director' : currentHospital?.adminContact?.name || 'Chief Coordinator'}
              </span>
            </div>

            <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 sm:col-span-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                {isAdmin ? 'Jurisdiction & Authority' : 'Hospital Address'}
              </span>
              <span className="text-xs font-medium text-on-surface">
                {isAdmin
                  ? 'National Organ Allocation Headquarters, Governance District, New Delhi - 110011'
                  : currentHospital
                  ? `${currentHospital.address}, ${currentHospital.city}, ${currentHospital.state} - ${currentHospital.pincode}`
                  : 'Medical Enclave District, Bengaluru, Karnataka - 560001'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Alert Preferences */}
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/20">
            Notification Settings
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Urgent Organ Viability Warnings</span>
                <span className="text-[11px] text-on-surface-variant">Get instant alerts when organ cutoff time is under 60 minutes</span>
              </div>
              <input
                type="checkbox"
                checked={urgentAlertsEnabled}
                onChange={e => setUrgentAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Sound Alerts for Proposals</span>
                <span className="text-[11px] text-on-surface-variant">Play audio alert on incoming high-urgency match proposals</span>
              </div>
              <input
                type="checkbox"
                checked={soundAlertsEnabled}
                onChange={e => setSoundAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-on-surface block">Daily Email Digest</span>
                <span className="text-[11px] text-on-surface-variant">Receive a morning summary of active donor organ listings</span>
              </div>
              <input
                type="checkbox"
                checked={digestEnabled}
                onChange={e => setDigestEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-2.5 px-6 rounded-full shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
