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
      <div className="rounded-xl bg-zinc-900 border border-white/7 p-6 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden min-h-[300px]">
        <div className="animate-scan" />
        <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 relative">
          <Cpu className="w-7 h-7" />
          <div className="absolute inset-0 rounded-full border-2 border-zinc-600/50 border-t-transparent animate-spin" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Agentic Orchestrator Active</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs font-mono">
            Validating input → Classifying remote-sensing task → Routing to specialist model...
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-white/5 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[220px]">
        <Layers className="w-8 h-8 text-zinc-600" />
        <p className="text-xs font-medium text-zinc-500">Analysis Results</p>
        <p className="text-[11px] text-zinc-500 max-w-xs">
          Upload imagery and submit a natural-language query to view agentic task detection, model inference, and visual evidence.
        </p>
      </div>
    );
  }

  const isSpecialist = result.modelSource === ModelSource.SPECIALIST;

  const handleDownloadReport = () => {
    window.open(api.getReportUrl(result.id), '_blank');
  };

  const handleDownloadPdf = async () => {
    const { generateAnalysisPdf } = await import('../lib/generatePdf');
    await generateAnalysisPdf(result as any);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Card: Detected Task & Model Source */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-white/7 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-700 border border-white/8 text-zinc-300 font-mono text-[10px] font-bold uppercase">
              Task: {result.detectedTask}
            </span>
            <span className="text-xs text-zinc-500 font-mono">• {result.inputType}</span>
          </div>

          {/* Confidence Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 font-mono text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confidence: {formatConfidence(result.confidence)}</span>
          </div>
        </div>

        {/* Model Transparency Tag */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            Active Model:
          </span>
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              isSpecialist
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
            }`}
          >
            {result.modelUsed} {isSpecialist ? '(Specialist ML)' : '(Fallback AI)'}
          </span>
        </div>

        {/* Natural-Language Answer Box */}
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/5 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Synthesized AI Response
          </span>
          <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
            {result.answer}
          </p>
        </div>

        {/* Metrics Bar & Download */}
        <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-600" />
            Processing Time: {result.processingTime}ms
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors border border-white/8"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download TXT</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors border border-white/8"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Evidence Section (if available) */}
      {result.evidence && result.evidence.length > 0 && (
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/7 flex flex-col gap-2.5">
          <h4 className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            Extracted Visual Evidence ({result.evidence.length})
          </h4>
          <div className="flex flex-col gap-2">
            {result.evidence.map((ev, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 text-xs flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 flex-shrink-0" />
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase px-1 py-0.5 rounded bg-zinc-800 border border-white/7 mr-1.5">
                    {ev.type}
                  </span>
                  <span className="text-zinc-300 font-medium">{ev.description}</span>
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
