'use client';

import React, { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Sidebar } from './Sidebar';
import AuthGuard from './AuthGuard';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0d14]">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — static on desktop, sliding drawer on mobile */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-[#0f1219] border-b border-gray-800/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo_convexo.png"
              alt="Convexo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-white font-bold text-sm">Convexo</span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AuthGuard>{children}</AuthGuard>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
