'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = usePlatform();

  // Step 1: Request token; Step 2: Reset password
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Step 2 Form
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Feedback Messages
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Step 1: Request Reset Token
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsRequesting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const receivedToken = json?.data?.reset_token;
        if (receivedToken) {
          setToken(receivedToken);
          setMessage('Reset token generated! For demo purposes, we have pre-filled the token below.');
        } else {
          setMessage(json?.message || 'If that account exists, reset instructions have been issued.');
        }
        setStep(2);
      } else {
        setErrorMessage(json?.error || 'Failed to request password reset. Please verify the email.');
      }
    } catch {
      setErrorMessage('Could not connect to authentication server.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle Step 2: Perform Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsResetting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Password Updated',
          message: 'Your new password was saved to the database. Please sign in.',
        });
        router.push('/login');
      } else {
        setErrorMessage(json?.error || 'Failed to reset password. The token may be expired.');
      }
    } catch {
      setErrorMessage('Could not connect to authentication server.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest/90 backdrop-blur-xl rounded-3xl border border-outline-variant/40 shadow-xl p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-secondary/20 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">key</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            {step === 1 ? 'Forgot Password' : 'Set New Password'}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
            {step === 1
              ? 'Enter your registered hospital account email to request a reset token.'
              : 'Enter the verification token & your new secure password.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-start gap-2.5 animate-in fade-in">
            <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-primary-container/30 border border-primary/30 text-on-primary-container text-xs flex items-start gap-2.5 animate-in fade-in">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
              info
            </span>
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: Request Token */}
        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Registered Hospital Email
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
                  placeholder="priya.sharma@metrogeneral.med.in"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRequesting}
              className="w-full py-3 px-4 bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
            >
              {isRequesting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                  Generating Token...
                </>
              ) : (
                <>
                  <span>Request Reset Token</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Reset Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste token here"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                New Password (min 8 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="NewSecurePass@123"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
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

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 text-xs bg-surface-container border border-outline-variant/40 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
            >
              {isResetting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <span>Save New Password & Sign In</span>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center flex justify-between text-xs text-on-surface-variant">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Change Email
            </button>
          ) : (
            <div />
          )}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
