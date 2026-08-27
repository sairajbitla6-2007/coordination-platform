'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function ToastContainer() {
  const { toasts, dismissToast } = usePlatform();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map(toast => {
        let borderClass = 'border-primary/20 bg-surface-container-lowest text-on-surface';
        let icon = 'info';
        let iconColor = 'text-primary';

        if (toast.type === 'success') {
          borderClass = 'border-primary/40 bg-surface-container-lowest text-on-surface';
          icon = 'check_circle';
          iconColor = 'text-primary';
        } else if (toast.type === 'warning') {
          borderClass = 'border-tertiary-container bg-surface-container-lowest text-on-surface';
          icon = 'warning';
          iconColor = 'text-tertiary';
        } else if (toast.type === 'error') {
          borderClass = 'border-error-container bg-error-container text-on-error-container';
          icon = 'error';
          iconColor = 'text-error';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-4 shadow-lg border flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${borderClass}`}
          >
            <span className={`material-symbols-outlined text-[24px] shrink-0 ${iconColor}`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{toast.message}</p>
              {toast.link && (
                <Link
                  href={toast.link}
                  onClick={() => dismissToast(toast.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline"
                >
                  View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
