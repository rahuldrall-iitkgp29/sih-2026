'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Clock, Cpu } from 'lucide-react';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setBackendStatus('online');
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: Layers },
    { label: 'History', href: '/history', icon: Clock },
    { label: 'Model Registry', href: '/models', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Navigation links */}
        <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' ? pathname === '/' || pathname === '/dashboard' : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 animate-ping'
                  : backendStatus === 'offline'
                  ? 'bg-amber-500'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 text-[11px]">
              {backendStatus === 'online'
                ? 'Backend: Connected'
                : backendStatus === 'offline'
                ? 'Backend: Standby'
                : 'Probing...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

