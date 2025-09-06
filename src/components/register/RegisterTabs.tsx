'use client';

import React from 'react';
import { Program } from '@/lib/registrationSchemas';
import { cn } from '@/lib/utils';
import { Calendar, Users, Zap, Star, Clock, CheckCircle } from 'lucide-react';

type Props = {
  active: Program;
  onChange: (p: Program) => void;
};

const tabs: {
  key: Program;
  label: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  duration: string;
}[] = [
  {
    key: 'energy_week_2',
    label: 'Energy Week 2',
    title: 'Energy Week 2 Program',
    description: 'Join our flagship energy event with hands-on workshops, competitions, and networking opportunities.',
    icon: Zap,
    features: ['Industry Networking', 'Leadership Roles'],
    duration: '1 Week',

  },
  {
    key: 'female_energy_club',
    label: 'Female Energy Club',
    title: 'Female Energy Club Program',
    description: 'Empowering students in energy through mentorship, skill development, and community building initiatives.',
    icon: Star,
    features: ['Skill Development', 'Community Building', 'Career Guidance'],
    duration: 'Ongoing',
  },
];

export default function RegisterTabs({ active, onChange }: Props) {
  return (
    <div className="w-full mb-8">
      {/* Mobile Dropdown View */}
      <div className="block lg:hidden">
        <label htmlFor="program-select" className="sr-only">
          Select a program
        </label>
        <select
          id="program-select"
          value={active}
          onChange={(e) => onChange(e.target.value as Program)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Card View */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none focus:ring-4 focus:ring-blue-500/20 hover:shadow-lg hover:scale-[1.02]',
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
              aria-selected={isActive}
              role="tab"
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'text-lg font-semibold mb-1 transition-colors',
                    isActive ? 'text-blue-900' : 'text-gray-900'
                  )}>
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
              <p className={cn(
                'text-sm mb-4 leading-relaxed transition-colors',
                isActive ? 'text-blue-700' : 'text-gray-600'
              )}>
                {tab.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <h4 className={cn(
                  'text-xs font-semibold uppercase tracking-wide transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  What You'll Get
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {tab.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        isActive ? 'bg-blue-500' : 'bg-gray-400'
                      )} />
                      <span className={cn(
                        'text-xs transition-colors',
                        isActive ? 'text-blue-700' : 'text-gray-600'
                      )}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className={cn(
                'absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-green-500/5 opacity-0 transition-opacity',
                !isActive && 'group-hover:opacity-100'
              )} />
            </button>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>
            Step 1 of 4: Choose your program
          </span>
        </div>
      </div>
    </div>
  );
}