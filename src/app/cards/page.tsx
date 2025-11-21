'use client';

import React from 'react';

export default function CardsPage() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center gap-4 md:gap-8 p-2 md:p-4"
      style={{ backgroundColor: '#282828' }}
    >
      {/* Leaders Card */}
      <div className="h-screen flex items-center justify-center flex-1 overflow-hidden">
        <img
          src="/1.svg"
          alt="Leaders Membership Card"
          className="w-auto h-full object-contain"
          style={{ 
            maxHeight: '100vh',
            maxWidth: '100%',
            height: '100%'
          }}
        />
      </div>

      {/* Members Card */}
      <div className="h-screen flex items-center justify-center flex-1 overflow-hidden">
        <img
          src="/2.svg"
          alt="Members Membership Card"
          className="w-auto h-full object-contain"
          style={{ 
            maxHeight: '100vh',
            maxWidth: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}

