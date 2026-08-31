'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Terminal } from 'lucide-react';
import { ExecutionStep } from '../types';

interface ExecutionTraceProps {
  steps: ExecutionStep[];
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ steps = [] }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-xl border border-white/7 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-950/80 flex items-center justify-between text-left hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-mono font-semibold text-zinc-300">
            Agent Execution Audit Trace ({steps.length} steps)
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {/* Steps List */}
      {isOpen && (
        <div className="p-4 flex flex-col gap-2 bg-zinc-950/60">
          <p className="text-[10px] text-zinc-600 font-mono mb-1">
            *Auditable orchestration events — Internal chain-of-thought is preserved server-side.
          </p>

          <div className="flex flex-col gap-2 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 pl-1 relative z-10 text-xs font-mono">
                <div className="mt-0.5 flex-shrink-0 bg-zinc-950 rounded-full">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : step.status === 'failed' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-600">
                      ○
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                  <div className="truncate">
                    <span className="text-zinc-300 font-medium">{step.name}</span>
                    {step.detail && (
                      <span className="text-zinc-600 text-[11px] ml-1.5 truncate">
                        ({step.detail})
                      </span>
                    )}
                  </div>

                  {step.duration !== undefined && (
                    <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                      +{step.duration}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
