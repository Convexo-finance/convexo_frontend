'use client';

import React, { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import AuthGuard from './AuthGuard';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0d14]">
      {/* Sidebar — width-based transition so content always shifts, never overlaps */}
      <aside
        className={`
          relative flex-shrink-0 overflow-hidden
          transition-[width] duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-0'}
        `}
      >
        {/* Fixed-width inner container — stays w-64 while wrapper animates */}
        <div className="w-64 h-full">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Top bar — toggle visible on all screen sizes */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-[#0f1219] border-b border-gray-800/50">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
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
          <AuthGuard>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </AuthGuard>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
