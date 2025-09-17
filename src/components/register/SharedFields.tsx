'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, Path, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

type SharedFieldNames =
  | 'fullName'
  | 'email'
  | 'kfupmId'
  | 'mobile'
  | 'academicYear'
  | 'linkedIn'
  | 'previous'
  | 'competitions'
  | 'energy';

type Props<TForm extends FieldValues> = {
  register: UseFormRegister<TForm>;
  errors: FieldErrors<TForm>;
  // enum values for academic years
  academicYears: string[];
};

// Enhanced form field component
function EnhancedField<TForm extends FieldValues>({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  register,
  error,
  value,
  children,
  description,
  maxLength,
  inputMode,
  pattern,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  register?: ReturnType<UseFormRegister<TForm>>;
  error?: any;
  value?: any;
  children?: React.ReactNode;
  description?: string;
  maxLength?: number;
  inputMode?: string;
  pattern?: string;
}) {
  const hasError = !!error;
  const hasValue = value && (typeof value === 'string' ? value.trim() : true);
  const isValid = hasValue && !hasError;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className={cn("font-medium", hasError ? "text-red-700" : "text-gray-900")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {isValid && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        {hasError && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      
      {description && (
        <div className="flex items-start gap-2">
          <Info className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      )}
      
      <div className="relative">
        {children || (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode as any}
            pattern={pattern}
            className={cn(
              "block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              hasError
                ? "border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus-visible:ring-red-500"
                : isValid
                ? "border-green-300 bg-green-50 text-green-900 focus-visible:ring-green-500"
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus-visible:ring-blue-500 hover:border-gray-400"
            )}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : undefined}
            {...register}
          />
        )}
        
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p id={`${id}-error`} className="text-sm text-red-700" aria-live="polite">
            {String(error?.message || 'This field is required')}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SharedFields<TForm extends FieldValues>({
  register,
  errors,
  academicYears,
}: Props<TForm>) {
  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <EnhancedField<TForm>
            id="fullName"
            label="Full Name"
            required
            placeholder="Enter your full name"
            register={register('fullName' as Path<TForm>)}
            error={errors['fullName' as Path<TForm>]}
            value={(undefined as any)} // We'll need to get this from form state
            description="Your full name as it appears on official documents"
          />

          <EnhancedField<TForm>
            id="email"
            label="Personal Email"//⚠️ If you use your university email, messages may go to Junk. Please use your personal email.
            type="email"
            required
            placeholder="your.email@example.com"
            register={register('email' as Path<TForm>)}
            error={errors['email' as Path<TForm>]}
            description="We'll use this to contact you about your application, If you use your university email, messages may go to Junk. Please use your personal email. ⚠️"
          />
          
          

          <EnhancedField<TForm>
            id="kfupmId"
            label="KFUPM ID"
            required
            placeholder="202XXXXXX"
            maxLength={9}
            inputMode="numeric"
            pattern="\d{9}"
            register={register('kfupmId' as Path<TForm>)}
            error={errors['kfupmId' as Path<TForm>]}
            description="Your 9-digit KFUPM student ID number"
          />

          <EnhancedField<TForm>
            id="mobile"
            label="Mobile Number"
            type="tel"
            required
            placeholder="+966 5XX XXX XXX"
            register={register('mobile' as Path<TForm>)}
            error={errors['mobile' as Path<TForm>]}
            description="Saudi mobile number for SMS notifications"
          />

          <EnhancedField<TForm>
            id="academicYear"
            label="Academic Year"
            required
            register={register('academicYear' as Path<TForm>)}
            error={errors['academicYear' as Path<TForm>]}
            description="Your current academic level"
          >
            <select
              id="academicYear"
              className={cn(
                "block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                errors['academicYear' as Path<TForm>]
                  ? "border-red-300 bg-red-50 text-red-900 focus-visible:ring-red-500"
                  : "border-gray-300 bg-white text-gray-900 focus-visible:ring-blue-500 hover:border-gray-400"
              )}
              aria-invalid={!!errors['academicYear' as Path<TForm>]}
              {...register('academicYear' as Path<TForm>)}
            >
              <option value="">Select your academic year</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </EnhancedField>

          <EnhancedField<TForm>
            id="linkedIn"
            label="LinkedIn Profile"
            type="url"
            placeholder="https://www.linkedin.com/in/username"
            register={register('linkedIn' as Path<TForm>)}
            error={errors['linkedIn' as Path<TForm>]}
            description="Optional: Share your professional profile"
          />
        </div>
      </div>

      {/* Experience Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Experience & Background</h3>
        <p className="text-sm text-gray-600 mb-6">
          Help us understand your background and interests. These fields are optional but help us match you with the right opportunities.
        </p>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="previous" className="font-medium text-gray-900">Previous Experience</Label>
            <p className="text-xs text-gray-600 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Share any relevant work, internships, or project experience
            </p>
            <Textarea
              id="previous"
              placeholder="Describe your previous relevant experience..."
              className={cn(
                "min-h-[120px] transition-colors",
                errors['previous' as Path<TForm>]
                  ? "border-red-300 focus-visible:ring-red-500"
                  : "focus-visible:ring-blue-500"
              )}
              maxLength={800}
              aria-invalid={!!errors['previous' as Path<TForm>]}
              {...register('previous' as Path<TForm>)}
            />
            {errors['previous' as Path<TForm>] && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {String(errors['previous' as Path<TForm>]?.message)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitions" className="font-medium text-gray-900">Competitions & Hackathons</Label>
            <p className="text-xs text-gray-600 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Tell us about competitions you've participated in
            </p>
            <Textarea
              id="competitions"
              placeholder="Share competitions, hackathons, or contests you've joined..."
              className={cn(
                "min-h-[120px] transition-colors",
                errors['competitions' as Path<TForm>]
                  ? "border-red-300 focus-visible:ring-red-500"
                  : "focus-visible:ring-blue-500"
              )}
              maxLength={800}
              aria-invalid={!!errors['competitions' as Path<TForm>]}
              {...register('competitions' as Path<TForm>)}
            />
            {errors['competitions' as Path<TForm>] && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {String(errors['competitions' as Path<TForm>]?.message)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="energy" className="font-medium text-gray-900">Why Energy?</Label>
            <p className="text-xs text-gray-600 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              What motivates your interest in the energy sector?
            </p>
            <Textarea
              id="energy"
              placeholder="Describe your passion for energy and sustainability..."
              className={cn(
                "min-h-[120px] transition-colors",
                errors['energy' as Path<TForm>]
                  ? "border-red-300 focus-visible:ring-red-500"
                  : "focus-visible:ring-blue-500"
              )}
              maxLength={800}
              aria-invalid={!!errors['energy' as Path<TForm>]}
              {...register('energy' as Path<TForm>)}
            />
            {errors['energy' as Path<TForm>] && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  {String(errors['energy' as Path<TForm>]?.message)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
