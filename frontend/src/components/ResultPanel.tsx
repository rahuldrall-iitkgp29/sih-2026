'use client';

import React from 'react';
import { Download, Cpu, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { AnalysisResult, ModelSource } from '../types';
import { formatConfidence } from '../lib/utils';
import { ExecutionTrace } from './ExecutionTrace';
import { api } from '../lib/api';

interface ResultPanelProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl glass-panel border border-cyan-500/20 p-6 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden min-h-[300px]">
        <div className="animate-scan" />
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 relative">
          <Cpu className="w-7 h-7 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 border-t-transparent animate-spin" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Agentic Orchestrator Active</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs font-mono">
            Validating input → Classifying remote-sensing task → Routing to specialist model...
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl glass-panel border border-white/5 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[220px]">
        <Layers className="w-8 h-8 text-slate-600" />
        <p className="text-xs font-medium text-slate-400">Analysis Results</p>
        <p className="text-[11px] text-slate-500 max-w-xs">
          Upload imagery and submit a natural-language query to view agentic task detection, model inference, and visual evidence.
        </p>
      </div>
    );
  }

  const isSpecialist = result.modelSource === ModelSource.SPECIALIST;

  const handleDownloadReport = () => {
    window.open(api.getReportUrl(result.id), '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Card: Detected Task & Model Source */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold uppercase">
              Task: {result.detectedTask}
            </span>
            <span className="text-xs text-slate-400 font-mono">• {result.inputType}</span>
          </div>

          {/* Confidence Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confidence: {formatConfidence(result.confidence)}</span>
          </div>
        </div>

        {/* Model Transparency Tag */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Active Model:
          </span>
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              isSpecialist
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}
          >
            {result.modelUsed} {isSpecialist ? '(Specialist ML)' : '(Fallback AI)'}
          </span>
        </div>

        {/* Natural-Language Answer Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Synthesized AI Response
          </span>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {result.answer}
          </p>
        </div>

        {/* Metrics Bar & Download */}
        <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Processing Time: {result.processingTime}ms
          </span>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Visual Evidence Section (if available) */}
      {result.evidence && result.evidence.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col gap-2.5">
          <h4 className="text-xs font-mono uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Extracted Visual Evidence ({result.evidence.length})
          </h4>
          <div className="flex flex-col gap-2">
            {result.evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 text-xs flex items-start gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-mono text-[10px] text-cyan-300 uppercase px-1 py-0.2 rounded bg-cyan-950 border border-cyan-500/20 mr-1.5">
                    {ev.type}
                  </span>
                  <span className="text-slate-300 font-medium">{ev.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auditable Execution Trace */}
      <ExecutionTrace steps={result.executionTrace} />
    </div>
  );
};
