'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform, JWT_KEY } from '@/lib/context/PlatformContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentRole, setCurrentHospitalId, showToast } = usePlatform();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
            title: 'Welcome Back, Admin',
            message: 'Authenticated with Administrator Governance Privileges.',
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
            message: 'Hospital account authenticated successfully.',
          });
          router.push('/dashboard');
        }
      } else {
        setErrorMessage(
          json?.error || json?.message || 'Invalid credentials or inactive hospital account.'
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

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl border border-outline-variant/40 shadow-xl p-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Hospital Staff Login</h1>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
            Access your secure hospital portal, organ matching pool, & real-time logistics.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
            <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Hospital Email Address
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
                placeholder="coordinator@hospital.org"
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
            className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Hospital Account</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Register Link */}
        <div className="mt-8 text-center text-xs text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Register Hospital
          </Link>
        </div>
      </div>
    </div>
  );
}
