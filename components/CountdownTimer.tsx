'use client';

import React, { useEffect, useState } from 'react';
import { usePlatform } from '@/lib/context/PlatformContext';

interface CountdownTimerProps {
  targetDate: string; // ISO string
  label?: string;
  showProgress?: boolean;
  totalDurationMinutes?: number;
  size?: 'sm' | 'md' | 'lg';
  onExpire?: () => void;
}

export default function CountdownTimer({
  targetDate,
  label = 'Time Remaining',
  showProgress = false,
  totalDurationMinutes = 60,
  size = 'md',
  onExpire
}: CountdownTimerProps) {
  const { simulatedTimeOffsetMinutes } = usePlatform();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalSecondsLeft: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSecondsLeft: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now() + simulatedTimeOffsetMinutes * 60 * 1000;
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSecondsLeft: 0
        });
        if (onExpire) onExpire();
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSecondsLeft: totalSec
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, simulatedTimeOffsetMinutes, onExpire]);

  const isCritical = !timeLeft.isExpired && timeLeft.hours === 0 && timeLeft.minutes < 30;
  const isWarning = !timeLeft.isExpired && timeLeft.hours === 0 && timeLeft.minutes < 60;

  let colorClass = 'text-on-surface-variant bg-surface-container';
  let badgeColor = 'bg-primary text-on-primary';
  let iconColor = 'text-primary';

  if (timeLeft.isExpired) {
    colorClass = 'text-outline bg-surface-dim';
    badgeColor = 'bg-outline text-on-surface';
    iconColor = 'text-outline';
  } else if (isCritical) {
    colorClass = 'text-on-error-container bg-error-container/80 border-error/30 animate-pulse';
    badgeColor = 'bg-error text-on-error';
    iconColor = 'text-error';
  } else if (isWarning) {
    colorClass = 'text-on-tertiary-container bg-tertiary-container/30 border-tertiary/30';
    badgeColor = 'bg-tertiary text-on-tertiary';
    iconColor = 'text-tertiary';
  }

  const formatDigits = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs font-mono font-medium ${colorClass}`}
    >
      <span className={`material-symbols-outlined text-[16px] ${iconColor}`}>
        {timeLeft.isExpired ? 'timer_off' : 'timer'}
      </span>
      <div className="flex flex-col">
        {label && <span className="text-[10px] uppercase font-sans tracking-wider opacity-75">{label}</span>}
        <span className="tabular-nums font-semibold tracking-tight text-xs">
          {timeLeft.isExpired ? (
            '00:00:00 (EXPIRED)'
          ) : (
            `${formatDigits(timeLeft.hours)}h ${formatDigits(timeLeft.minutes)}m ${formatDigits(
              timeLeft.seconds
            )}s`
          )}
        </span>
      </div>
    </div>
  );
}
