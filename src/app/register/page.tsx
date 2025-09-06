'use client';

import React, { useState } from 'react';
import RegisterTabs from '@/components/register/RegisterTabs';
import EnergyWeekForm from '@/components/register/EnergyWeekForm';
import FemaleEnergyClubForm from '@/components/register/FemaleEnergyClubForm';
import type { Program } from '@/lib/registrationSchemas';
import { Users, Calendar, Award, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [active, setActive] = useState<Program>('energy_week_2');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}    
      <div className="relative overflow-hidden bg-gradient-to-r from-[#25818a] to-[#f8cd5c] text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full animate-bounce-custom">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-down">
              Join Our Energy Community
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in-up">
              Be part of innovative programs that shape the future of energy.
              Apply now to contribute your skills and passion to meaningful projects.
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 stagger-animation">
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                <span>Flexible Timeline</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Award className="h-5 w-5 flex-shrink-0" />
                <span>Leadership Opportunities</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100 form-transition hover:text-white hover:scale-105">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>Collaborative Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Program Selection Section */}
        <div className="mb-12 animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-slide-in-left">
              Choose Your Program
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-slide-in-right">
              Select the program that aligns with your interests and career goals.
              Both programs offer unique opportunities for growth and impact.
            </p>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <RegisterTabs active={active} onChange={setActive} />
          </div>
        </div>

        {/* Application Form Section */}
        <section aria-live="polite" className="relative">
          {/* Estimated Time Banner */}
          <div className="mb-6 bg-blue-50 border backdrop-blur-md border-blue-200 rounded-lg p-4 animate-slide-in-left btn-hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium animate-pulse-custom">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 form-transition">
                    {active === 'energy_week_2' ? 'Energy Week 2 Application' : 'Female Energy Club Application'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Estimated completion time: 5-10 minutes
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-blue-600 animate-bounce-custom">
                <span>Ready to start?</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="transition-all duration-500 ease-in-out">
            {active === 'energy_week_2' ? (
              <div className="animate-fade-in-up">
                <EnergyWeekForm />
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <FemaleEnergyClubForm />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Information */}
      {/* <div className="bg-gray-50 border-t">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about the application process or programs,
              feel free to reach out to our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@energy.kfupm.edu.sa"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Email Support
              </a>
              <a
                href="/faq"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View FAQ
              </a>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}