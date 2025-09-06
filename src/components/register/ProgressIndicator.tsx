'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
}

export default function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.current);
  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Progress Bar */}
      <div className="block sm:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {currentStepIndex >= 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {steps[currentStepIndex].description}
          </p>
        )}
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Application Progress</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{completedSteps} of {steps.length} completed</span>
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps / Math.max(steps.length - 1, 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = step.completed;
              const isCurrent = step.current;
              const isPast = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center text-center max-w-[120px]"
                >
                  {/* Step Circle */}
                  <div className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300',
                    isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isCurrent
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : isPast
                      ? 'bg-gray-100 border-gray-300 text-gray-400'
                      : 'bg-white border-gray-300 text-gray-400'
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Circle className={cn(
                        'h-4 w-4',
                        isCurrent ? 'fill-current' : ''
                      )} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1">
                    <h4 className={cn(
                      'text-xs font-medium transition-colors',
                      isCompleted || isCurrent 
                        ? 'text-gray-900' 
                        : 'text-gray-500'
                    )}>
                      {step.title}
                    </h4>
                    <p className={cn(
                      'text-xs leading-tight transition-colors',
                      isCompleted || isCurrent 
                        ? 'text-gray-600' 
                        : 'text-gray-400'
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate form progress
export function calculateFormProgress(
  values: any,
  errors: any,
  requiredFields: string[]
): { completedFields: number; totalFields: number; progress: number } {
  const completedFields = requiredFields.filter(field => {
    const value = values[field];
    const hasError = errors[field];
    
    // Field is completed if it has a value and no errors
    if (hasError) return false;
    
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true; // Checkboxes are always considered completed
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    
    return false;
  }).length;
  
  const totalFields = requiredFields.length;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  
  return { completedFields, totalFields, progress };
}