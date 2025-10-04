'use client';

import React from 'react';
import type { Program } from '@/lib/registrationSchemas';
import { cn } from '@/lib/utils';
import { Calendar, Users, Zap, Star, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';

type Props = {
  active: Program;
  onChange: (p: Program) => void;
  availability?: Partial<Record<Program, boolean>>;
  showAdmin?: boolean;  // NEW
  onAdminToggle?: (program: Program, open: boolean) => void; // NEW
};

const tabs: {
  key: Program;
  label: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  duration: string;
  disabled?: boolean;
  disabledMessage?: string;
}[] = [
  {
    key: 'energy_week_2',
    label: 'Energy Week 2',
    title: 'Energy Week 2 Program',
    description:
      'Join our flagship energy event with hands-on workshops, competitions, and networking opportunities.',
    icon: Zap,
    features: ['Industry Networking', 'Leadership Roles'],
    duration: '1 Week',
  },
  {
    key: 'female_energy_club',
    label: 'Female Energy Club',
    title: 'Female Energy Club Program',
    description:
      'Empowering students in energy through mentorship, skill development, and community building initiatives.',
    icon: Star,
    features: ['Skill Development', 'Community Building', 'Career Guidance'],
    duration: 'Ongoing',
  },
];

const tabImages: Record<Program, { src: string; alt: string }> = {
  energy_week_2: { src: '/energyWeekLogo.png', alt: 'Energy Week preview' },
  female_energy_club: { src: '/energyClubLogo.png', alt: 'Female Energy Club preview' },
};

export default function RegisterTabs({
  active,
  onChange,
  availability = { energy_week_2: true, female_energy_club: true },
  showAdmin = false,
  onAdminToggle,
}: Props) {
  const ew2Open = availability.energy_week_2 !== false;
  const fecOpen = availability.female_energy_club !== false;

  const handleKey = (e: React.KeyboardEvent, disabled: boolean, key: Program) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // prevent page scroll on Space
      onChange(key);
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {/* Visible mobile cards for better discoverability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            const isDisabled = tab.key === 'energy_week_2' ? !ew2Open : !fecOpen;
            const cardDisabled = isDisabled && !showAdmin;

            return (
              <div
                key={tab.key}
                role="button"
                tabIndex={cardDisabled ? -1 : 0}
                aria-disabled={cardDisabled || undefined}
                aria-pressed={isActive || undefined}
                onClick={() => !cardDisabled && onChange(tab.key)}
                onKeyDown={(e) => handleKey(e, cardDisabled, tab.key)}
                className={cn(
                  'relative flex items-center gap-3 p-4 rounded-lg border transition-all text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20',
                  isDisabled
                    ? `border-gray-200 bg-gray-50 ${
                        showAdmin ? 'cursor-default' : 'cursor-not-allowed'
                      } opacity-60`
                    : isActive
                    ? 'border-blue-500 bg-blue-50 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                )}
              >
                <div className="flex-shrink-0 rounded-md overflow-hidden border bg-white">
                  <Image
                    src={tabImages[tab.key].src}
                    alt={tabImages[tab.key].alt}
                    width={56}
                    height={56}
                    className="object-contain p-2"
                  />
                </div>
              <div className="min-w-0 flex-1">
                {/* 2x2 grid: 
                    col1 = text, col2 = badge/dropdown
                    row1 = title + badge
                    row2 = status + dropdown (on the right) */}
                <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-2">
                  {/* Title (ellipsized) */}
                  <div
                    className={cn(
                      'font-medium leading-tight truncate min-w-0', // ellipsis
                      isActive ? 'text-blue-900' : isDisabled ? 'text-gray-500' : 'text-gray-900'
                    )}
                    title={tab.label}
                  >
                    {tab.label}
                  </div>

                  {/* Badge (top-right) */}
                <div className="col-start-2 row-start-1 self-start shrink-0 justify-self-end -mr-1 -mt-1 pointer-events-none">
                    {isDisabled ? (
                      <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold whitespace-nowrap">
                        Registration Closed
                      </span>
                    ) : isActive ? (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    ) : null}
                  </div>

                  {/* Status/Duration (bottom-left) */}
                  <div
                    className={cn(
                      'col-start-1 row-start-2 mt-1 text-xs',
                      isDisabled ? 'text-red-500' : 'text-gray-500'
                    )}
                  >
                    {isDisabled ? 'Registration Closed' : tab.duration}
                  </div>

                  {/* Dropdown (bottom-right, under badge) */}
                 {showAdmin && (
                  <div
                    className="col-start-2 row-start-2 justify-self-end mt-1"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <label htmlFor={`status-${tab.key}-m`} className="sr-only">
                      Registration status
                    </label>
                    <select
                      id={`status-${tab.key}-m`}
                      className="px-2 py-1 text-xs rounded-md border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={isDisabled ? 'closed' : 'open'}
                      onChange={(e) => onAdminToggle?.(tab.key, e.target.value === 'open')}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Close</option>
                    </select>
                  </div>
                )}

                </div>

                {/* Description below the grid */}
                <p
                  className={cn(
                    'mt-2 text-xs',
                    isDisabled ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {tab.description}
                </p>
              </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Card View */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const isDisabled = tab.key === 'energy_week_2' ? !ew2Open : !fecOpen;
          const cardDisabled = isDisabled && !showAdmin;

          const Icon = tab.icon;

          return (
            <div
              key={tab.key}
             
              role="button"
              tabIndex={cardDisabled ? -1 : 0}
              aria-disabled={cardDisabled || undefined}
              aria-pressed={isActive || undefined}
              onClick={() => !cardDisabled && onChange(tab.key)}
              onKeyDown={(e) => handleKey(e, cardDisabled, tab.key)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20',
                isDisabled
                  ? `border-gray-200 bg-gray-50 ${
                      showAdmin ? 'cursor-default' : 'cursor-not-allowed'
                    } opacity-60`
                  : isActive
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:scale-[1.02]'
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                    isDisabled
                      ? 'bg-gray-200 text-gray-400'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-lg font-semibold mb-1 transition-colors',
                      isDisabled ? 'text-gray-500' : isActive ? 'text-blue-900' : 'text-gray-900'
                    )}
                  >
                    {tab.label}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tab.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className={cn(
                  'text-sm mb-4 leading-relaxed transition-colors',
                  isActive ? 'text-blue-700' : 'text-gray-600'
                )}
              >
                {tab.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <h4
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}
                >
                  What You'll Get
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {tab.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full transition-colors',
                          isActive ? 'bg-blue-500' : 'bg-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs transition-colors',
                          isActive ? 'text-blue-700' : 'text-gray-600'
                        )}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Small Photo Section (dummy image) */}
              <div className="mt-4">
                <h4
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}
                >
                  Program Snapshot
                </h4>
                <div className="mt-2 inline-flex items-center gap-2">
                  <div className="rounded-md overflow-hidden border bg-white">
                    <Image
                      src={tabImages[tab.key].src}
                      alt={tabImages[tab.key].alt}
                      width={100}
                      height={100}
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div
                className={cn(
                  'absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-green-500/5 opacity-0 transition-opacity',
                  !isActive && 'group-hover:opacity-100'
                )}
              />

              {/* STATUS BADGE */}
              <div className="absolute top-3 right-3">
                {isDisabled ? (
                  <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
                    Registration Closed
                  </span>
                ) : isActive ? (
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                ) : null}
              </div>

              {/* ADMIN TOGGLE (desktop) */}
                {showAdmin && (
                  <div
                    className="absolute top-4 right-4 translate-y-9 z-10"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <label htmlFor={`status-${tab.key}-d`} className="sr-only">
                      Registration status
                    </label>
                    <select
                      id={`status-${tab.key}-d`}
                      className="px-2 py-1 text-xs rounded-md border bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={isDisabled ? 'closed' : 'open'}
                      onChange={(e) => onAdminToggle?.(tab.key, e.target.value === 'open')}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Close</option>
                    </select>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>Step 1 of 4: Choose your program</span>
        </div>
      </div>
    </div>
  );
}
