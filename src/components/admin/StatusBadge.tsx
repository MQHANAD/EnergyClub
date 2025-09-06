'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: 'pending' | 'accepted' | 'rejected';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500'
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-500'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500'
  }
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    iconSize: 'h-3 w-3',
    gap: 'gap-1'
  },
  md: {
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    iconSize: 'h-4 w-4',
    gap: 'gap-1.5'
  },
  lg: {
    text: 'text-base',
    padding: 'px-4 py-2',
    iconSize: 'h-5 w-5',
    gap: 'gap-2'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
  ariaLabel,
  className
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full font-medium border transition-all duration-150',
        // Size styles
        sizeStyles.text,
        sizeStyles.padding,
        sizeStyles.gap,
        // Status styles
        config.bgColor,
        config.textColor,
        config.borderColor,
        // Additional styles
        className
      )}
      aria-label={ariaLabel || `Application status: ${config.label}`}
      role="status"
    >
      {showIcon && (
        <Icon 
          className={cn(sizeStyles.iconSize, config.iconColor)} 
          aria-hidden="true"
        />
      )}
      <span className="font-medium uppercase tracking-wide">
        {config.label}
      </span>
    </span>
  );
};

export default StatusBadge;