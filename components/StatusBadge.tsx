import React from 'react';
import { ListingStatus, MatchStatus, TransportStatus, UrgencyLevel } from '@/lib/types';

interface StatusBadgeProps {
  status: ListingStatus | MatchStatus | TransportStatus | UrgencyLevel | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  let bg = 'bg-surface-container text-on-surface-variant border-outline-variant/30';
  let icon = 'info';
  let label = status;

  switch (status) {
    // Listing Statuses
    case 'ACTIVE':
      bg = 'bg-primary-fixed/30 text-on-primary-fixed-variant border-primary/20';
      icon = 'check_circle';
      label = 'Active Pool';
      break;
    case 'PENDING_MATCH':
      bg = 'bg-secondary-container text-on-secondary-container border-secondary/30';
      icon = 'lock';
      label = 'Locked (Match Pending)';
      break;
    case 'MATCHED':
      bg = 'bg-primary text-on-primary border-primary';
      icon = 'handshake';
      label = 'Matched';
      break;
    case 'EXPIRED':
      bg = 'bg-surface-dim text-outline border-outline/30';
      icon = 'timer_off';
      label = 'Expired (Viability Lapsed)';
      break;
    case 'COMPLETED':
      bg = 'bg-primary-container text-on-primary-container border-primary-container';
      icon = 'task_alt';
      label = 'Completed';
      break;

    // Match Statuses
    case 'PROPOSED':
      bg = 'bg-secondary-container text-on-secondary-container border-secondary/40';
      icon = 'hourglass_top';
      label = 'Proposal Pending';
      break;
    case 'CONFIRMED':
      bg = 'bg-primary text-on-primary border-primary';
      icon = 'verified';
      label = 'Confirmed';
      break;
    case 'DECLINED':
      bg = 'bg-surface-container-high text-on-surface-variant border-outline/30';
      icon = 'cancel';
      label = 'Declined';
      break;
    case 'AUTO_DECLINED':
      bg = 'bg-error-container/60 text-on-error-container border-error/20';
      icon = 'alarm_off';
      label = 'Auto-Declined (Timeout)';
      break;

    // Transport Statuses
    case 'PENDING':
      bg = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
      icon = 'pending';
      label = 'Awaiting Dispatch';
      break;
    case 'DISPATCHED':
      bg = 'bg-secondary-container text-on-secondary-container border-secondary/30';
      icon = 'inventory';
      label = 'Dispatched';
      break;
    case 'IN_TRANSIT':
      bg = 'bg-primary-fixed/40 text-on-primary-fixed-variant border-primary/30';
      icon = 'local_shipping';
      label = 'In Transit';
      break;
    case 'DELIVERED':
      bg = 'bg-primary text-on-primary border-primary';
      icon = 'done_all';
      label = 'Delivered & Accepted';
      break;

    // Urgency Levels
    case '1A_CRITICAL':
      bg = 'bg-error-container text-on-error-container border-error/30';
      icon = 'priority_high';
      label = 'Status 1A: Critical';
      break;
    case '1B_URGENT':
      bg = 'bg-tertiary-fixed/60 text-on-tertiary-fixed-variant border-tertiary/20';
      icon = 'error_outline';
      label = 'Status 1B: Urgent';
      break;
    case '2_STANDARD':
      bg = 'bg-surface-container text-on-surface-variant border-outline-variant';
      icon = 'schedule';
      label = 'Status 2: Standard';
      break;

    default:
      bg = 'bg-surface-container text-on-surface-variant border-outline-variant';
      icon = 'circle';
      label = status;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  }[size];

  const iconSizes = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-[18px]'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs font-body-md shrink-0 ${sizeClasses} ${bg} ${className}`}
    >
      <span className={`material-symbols-outlined shrink-0 ${iconSizes}`}>{icon}</span>
      <span className="truncate font-semibold tracking-tight">{label}</span>
    </span>
  );
}
