'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Clock, Cpu } from 'lucide-react';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.getHealth();
        setBackendStatus('online');
        setDbStatus(health.dependencies?.database === 'connected' ? 'connected' : 'disconnected');
      } catch (err) {
        setBackendStatus('offline');
        setDbStatus('disconnected');
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
    <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-white/6 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Navigation links */}
        <nav className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' ? pathname === '/' || pathname === '/dashboard' : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/8 text-zinc-100 border border-white/12'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Database Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950 border border-white/8 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected'
                  ? 'bg-emerald-500'
                  : dbStatus === 'disconnected'
                  ? 'bg-rose-500'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-zinc-400 text-[11px]">
              {dbStatus === 'connected'
                ? 'MongoDB: Connected'
                : dbStatus === 'disconnected'
                ? 'MongoDB: Disconnected'
                : 'MongoDB: Probing...'}
            </span>
          </div>

          {/* Backend Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950 border border-white/8 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-500'
                  : backendStatus === 'offline'
                  ? 'bg-amber-500'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="text-zinc-400 text-[11px]">
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

