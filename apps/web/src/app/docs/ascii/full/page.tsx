'use client';

import React from 'react';

import { AsciiTable } from '@/components/docs/AsciiTable';

export default function AsciiFullscreenPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <AsciiTable />
      </div>
    </div>
  );
}
