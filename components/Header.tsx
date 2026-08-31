'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function Header() {
  const pathname = usePathname();
  const {
    currentRole,
    currentHospitalId,
    currentHospital,
    hospitals,
    setCurrentRole,
    setCurrentHospitalId,
    notifications,
    matches
  } = usePlatform();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read && (n.hospitalId === currentHospitalId || (currentRole === 'ADMIN' && n.targetRole === 'ADMIN'))).length;

  const pendingRequestsCount = matches.filter(
    m => m.status === 'PROPOSED' && m.receivingHospitalId === currentHospitalId
  ).length;

  interface NavItem {
    href: string;
    label: string;
    icon: string;
    badge?: number;
  }

  const hospitalNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/listings', label: 'My Listings', icon: 'list_alt' },
    {
      href: '/requests',
      label: 'Requests',
      icon: 'inbox',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    { href: '/transport/MATCH-CONF-002', label: 'Transport', icon: 'local_shipping' },
    { href: '/history', label: 'History', icon: 'history' }
  ];

  const adminNavItems: NavItem[] = [
    { href: '/admin/queue', label: 'Verification Queue', icon: 'how_to_reg' },
    { href: '/history', label: 'National Registry Audit', icon: 'manage_search' }
  ];

  const navItems = currentRole === 'ADMIN' ? adminNavItems : hospitalNavItems;

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">favorite</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xl text-primary tracking-tight leading-none">LifeLink</span>
              <span className="text-[10px] text-on-surface-variant font-medium tracking-wider uppercase">Transplant Network</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                    isActive
                      ? 'bg-primary-container/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role & Hospital Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              title="Switch Active Hospital or Admin Role"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentRole === 'ADMIN'
                    ? 'bg-tertiary'
                    : currentHospital?.status === 'VERIFIED'
                    ? 'bg-primary'
                    : currentHospital?.status === 'PENDING_REVIEW'
                    ? 'bg-secondary'
                    : 'bg-error'
                }`}
              />
              <span className="hidden sm:inline font-semibold truncate max-w-[130px] md:max-w-[180px]">
                {currentRole === 'ADMIN'
                  ? 'NOTTO Admin Desk'
                  : currentHospital?.name.split(' ')[0] + ' ' + (currentHospital?.name.split(' ')[1] || '')}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_drop_down</span>
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Select Active Perspective
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setCurrentRole('HOSPITAL_USER');
                      setCurrentHospitalId('hosp-metro-gen');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-metro-gen'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Metro General Hospital</div>
                      <div className="text-[10px] text-on-surface-variant">Donor Coordinator • Verified</div>
                    </div>
                    {currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-metro-gen' && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('HOSPITAL_USER');
                      setCurrentHospitalId('hosp-st-jude');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-st-jude'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="font-medium">St. Jude Cardiac Institute</div>
                      <div className="text-[10px] text-on-surface-variant">Recipient Center • Verified</div>
                    </div>
                    {currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-st-jude' && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('HOSPITAL_USER');
                      setCurrentHospitalId('hosp-hope-center');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-hope-center'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="font-medium">Hope Specialty Hospital</div>
                      <div className="text-[10px] text-secondary font-medium">Pending Review Gate</div>
                    </div>
                    {currentRole === 'HOSPITAL_USER' && currentHospitalId === 'hosp-hope-center' && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('ADMIN');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      currentRole === 'ADMIN'
                        ? 'bg-tertiary/10 text-tertiary font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div>
                      <div className="font-medium">NOTTO National Admin Desk</div>
                      <div className="text-[10px] text-on-surface-variant">Verification & Registry Desk</div>
                    </div>
                    {currentRole === 'ADMIN' && (
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check</span>
                    )}
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-outline-variant/20 space-y-0.5">
                  <Link
                    href="/login"
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    Sign In with Password
                  </Link>
                  <Link
                    href="/register"
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Register New Hospital
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Notification Center Link */}
          <Link
            href="/notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
            )}
          </Link>

          {/* Hospital Profile Avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
            title="Hospital Profile & Settings"
          >
            <img
              alt="Profile"
              src={currentHospital?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=128'}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[22px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant/30 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === item.href
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-error text-on-error text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
            <Link
              href="/listings/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 bg-primary text-on-primary text-xs font-semibold py-2 px-3 rounded-lg text-center flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> New Listing
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-surface-container text-on-surface text-xs font-semibold py-2 px-3 rounded-lg text-center"
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
