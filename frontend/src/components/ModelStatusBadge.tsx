import React from 'react';
import { ModelStatus } from '../types';

interface ModelStatusBadgeProps {
  status: ModelStatus | string;
}

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case ModelStatus.AVAILABLE:
    case 'loaded':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Available
        </span>
      );
    case ModelStatus.LOADING:
    case 'loading':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-spin" />
          Loading
        </span>
      );
    case ModelStatus.UNAVAILABLE:
    case 'not_configured':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Not Configured
        </span>
      );
    case ModelStatus.ERROR:
    case 'error':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Error
        </span>
      );
  }
};
