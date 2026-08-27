'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, currentHospitalId, currentRole } = usePlatform();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');

  const visibleNotifications = notifications.filter(n => {
    if (currentRole === 'ADMIN') return n.targetRole === 'ADMIN' || !n.hospitalId;
    return n.hospitalId === currentHospitalId || !n.hospitalId;
  });

  const filteredNotifications = visibleNotifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'URGENT') return n.isUrgent;
    return true;
  });

  return (
    <RoleGuard requiredRole={currentRole === 'ADMIN' ? 'ADMIN' : 'HOSPITAL_USER'} requireVerifiedHospital={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Notifications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              Notifications & Activity Feed
            </h1>
          </div>

          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            Mark All as Read
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
          >
            All ({visibleNotifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all ${
              filter === 'UNREAD'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
          >
            Unread ({visibleNotifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilter('URGENT')}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1 ${
              filter === 'URGENT'
                ? 'bg-error text-on-error shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            Urgent Alerts
          </button>
        </div>

        {/* Notifications Feed */}
        {filteredNotifications.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-2">
            <span className="material-symbols-outlined text-outline text-[48px]">notifications_off</span>
            <h3 className="text-base font-semibold text-on-surface">No Notifications</h3>
            <p className="text-xs text-on-surface-variant">You're all caught up with active coordination alerts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notif => {
              const isUrgent = notif.isUrgent;

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`bg-surface-container-lowest rounded-2xl p-5 border transition-all shadow-2xs relative overflow-hidden flex items-start gap-4 ${
                    isUrgent
                      ? 'border-error/40 bg-error-container/10'
                      : notif.read
                      ? 'border-outline-variant/20 opacity-80'
                      : 'border-outline-variant/40 ring-1 ring-primary/10'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!notif.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? 'bg-error-container text-on-error-container'
                        : notif.type === 'PROPOSAL_RECEIVED'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : notif.type === 'TRANSPORT_UPDATE'
                        ? 'bg-primary-fixed/50 text-on-primary-fixed-variant'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {isUrgent
                        ? 'warning'
                        : notif.type === 'PROPOSAL_RECEIVED'
                        ? 'handshake'
                        : notif.type === 'TRANSPORT_UPDATE'
                        ? 'local_shipping'
                        : notif.type === 'MATCH_CONFIRMED'
                        ? 'verified'
                        : 'notifications'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between pr-4">
                      <h3
                        className={`text-sm font-semibold ${
                          isUrgent ? 'text-error font-bold' : 'text-on-surface'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="pt-2">
                        <Link
                          href={notif.link}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          Review Action <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
