'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'white' | 'gray';
}

export default function LoadingSpinner({ 
  size = 'md', 
  className,
  variant = 'primary' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    primary: 'border-blue-600 border-t-blue-200',
    white: 'border-white border-t-white/30',
    gray: 'border-gray-400 border-t-gray-200'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Enhanced loading button component
export function LoadingButton({
  loading = false,
  children,
  loadingText = 'Loading...',
  className,
  disabled,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ...props
}: {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  [key: string]: any;
}) {
  const isDisabled = loading || disabled;

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-500'
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && 'transform-none',
        className
      )}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          variant="white" 
          className="mr-2" 
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
}

// Loading skeleton component for better perceived performance
export function LoadingSkeleton({
  className,
  lines = 3,
  variant = 'default'
}: {
  className?: string;
  lines?: number;
  variant?: 'default' | 'card' | 'avatar';
}) {
  if (variant === 'card') {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('animate-pulse flex items-center space-x-4', className)}>
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}