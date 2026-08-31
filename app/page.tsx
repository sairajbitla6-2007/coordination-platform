'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform, JWT_KEY } from '@/lib/context/PlatformContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEMO_PRESETS = [
  {
    label: 'Metro General (Donor)',
    email: 'priya.sharma@metrogeneral.med.in',
    password: 'MetroDemo@2024',
    role: 'HOSPITAL_USER' as const,
    hospId: '11111111-0001-0001-0001-000000000001',
    badge: 'Donor Center',
  },
  {
    label: 'St. Jude (Recipient)',
    email: 'rajiv.menon@stjudeheart.org',
    password: 'StJudeDemo@2024',
    role: 'HOSPITAL_USER' as const,
    hospId: '11111111-0002-0002-0002-000000000002',
    badge: 'Recipient Center',
  },
  {
    label: 'Apollo Multi-Specialty',
    email: 'ananya.ray@apollo.org',
    password: 'ApolloDemo@2024',
    role: 'HOSPITAL_USER' as const,
    hospId: '11111111-0003-0003-0003-000000000003',
    badge: 'Transplant Center',
  },
  {
    label: 'NOTTO Admin Desk',
    email: 'admin@organlink.demo',
    password: 'AdminDemo@2024',
    role: 'ADMIN' as const,
    hospId: '',
    badge: 'Governance',
  },
];

export default function RootHomePage() {
  const router = useRouter();
  const { currentRole, setCurrentRole, setCurrentHospitalId, showToast } = usePlatform();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // If already authenticated, automatically route to respective panel
  useEffect(() => {
    const token = localStorage.getItem(JWT_KEY);
    if (token) {
      if (currentRole === 'ADMIN') {
        router.replace('/admin/queue');
      } else {
        router.replace('/dashboard');
      }
    } else {
      setIsCheckingAuth(false);
    }
  }, [currentRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.data?.access_token) {
        const token = json.data.access_token;
        const user = json.data.user;

        localStorage.setItem(JWT_KEY, token);

        if (user.role === 'ADMIN') {
          setCurrentRole('ADMIN');
          showToast({
            type: 'success',
            title: 'Authenticated as NOTTO Admin',
            message: 'Accessing Governance & Accreditation Panel.',
          });
          router.push('/admin/queue');
        } else {
          setCurrentRole('HOSPITAL_USER');
          if (user.hospital_id) {
            setCurrentHospitalId(user.hospital_id);
          }
          showToast({
            type: 'success',
            title: `Welcome, ${user.full_name || 'Coordinator'}`,
            message: 'Hospital Portal Authenticated Successfully.',
          });
          router.push('/dashboard');
        }
      } else {
        setErrorMessage(
          json?.error || json?.message || 'Invalid email or password.'
        );
      }
    } catch {
      setErrorMessage(
        'Could not connect to authentication server. Please check backend status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setErrorMessage('');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-on-surface-variant font-medium">Checking authentication session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl border border-outline-variant/40 shadow-xl p-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">favorite</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">LifeLink Authentication</h1>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
            Sign in to access your Hospital Coordinator Portal or NOTTO Admin Governance Desk.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-start gap-2.5 animate-in fade-in">
            <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              User Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="coordinator@hospital.org or admin@organlink.demo"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-on-surface">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                lock_clock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In & Open Panel</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Account Presets */}
        <div className="mt-8 pt-6 border-t border-outline-variant/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-3 text-center">
            Instant Demo Account Presets
          </span>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_PRESETS.map(preset => (
              <button
                key={preset.email}
                type="button"
                onClick={() => applyPreset(preset)}
                className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-left transition-all group"
              >
                <div className="text-[11px] font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                  {preset.label}
                </div>
                <div className="text-[9px] text-on-surface-variant font-mono truncate">
                  {preset.email}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Registration Link */}
        <div className="mt-6 text-center text-xs text-on-surface-variant">
          New Hospital?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register Hospital Application
          </Link>
        </div>
      </div>
    </div>
  );
}
