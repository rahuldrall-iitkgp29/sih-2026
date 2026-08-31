'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Search, Filter, Download, ArrowRight, Layers, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { AnalysisResult, TaskType } from '../../types';
import { api } from '../../lib/api';
import { formatConfidence } from '../../lib/utils';
import { ExecutionTrace } from '../../components/ExecutionTrace';

// PDF generation is imported dynamically inside the handler to avoid SSR issues
async function handleDownloadPdf(result: any) {
  const { generateAnalysisPdf } = await import('../../lib/generatePdf');
  await generateAnalysisPdf(result);
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('ALL');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await api.listAnalyses(30);
        setAnalyses(data);
      } catch (err) {
        // Fallback sample analyses if MongoDB is in offline mode
        setAnalyses([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredAnalyses = analyses.filter((a) => {
    const matchesSearch =
      a.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.detectedTask.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTask = selectedTask === 'ALL' || a.detectedTask === selectedTask;
    return matchesSearch && matchesTask;
  });

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/6 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-500" />
            <span>Analysis History & Audit Log</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse previous remote-sensing analyses, view execution traces, and download verification reports.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-white/8 transition-colors self-start sm:self-auto"
        >
          <span>New Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900 p-3 rounded-xl border border-white/7">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries, tasks, answers..."
            className="w-full bg-zinc-950 border border-white/8 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          {['ALL', 'VQA', 'CAPTION', 'CHANGE_ANALYSIS', 'OPTICAL_SAR_ANALYSIS'].map((task) => (
            <button
              key={task}
              type="button"
              onClick={() => setSelectedTask(task)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${
                selectedTask === task
                  ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                  : 'text-zinc-500 hover:text-zinc-200 bg-zinc-900/60'
              }`}
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Empty State */}
      {isLoading ? (
        <div className="bg-zinc-900 rounded-xl border border-white/7 p-12 text-center text-xs font-mono text-zinc-500 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
          <span>Retrieving analysis records from database...</span>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-white/7 p-12 text-center flex flex-col items-center justify-center gap-3">
          <Layers className="w-10 h-10 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No Past Analyses Recorded</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Execute analyses in the Dashboard workspace. All runs are automatically indexed with complete auditable execution traces.
          </p>
          <Link
            href="/"
            className="mt-2 px-4 py-2 rounded-lg bg-zinc-200 text-zinc-900 text-xs font-semibold hover:bg-white transition-colors"
          >
            Launch Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of Analyses (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {filteredAnalyses.map((item) => (
              <div
                key={(item as any).id ?? (item as any)._id ?? Math.random().toString()}
                onClick={() => setSelectedAnalysis(item)}
                className={`bg-zinc-900/80 p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  ((selectedAnalysis as any)?.id ?? (selectedAnalysis as any)?._id) === ((item as any).id ?? (item as any)._id)
                    ? 'border-zinc-500/70 bg-zinc-900'
                    : 'border-white/7 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-700 border border-white/8 text-zinc-300 font-mono text-[10px] font-bold uppercase">
                      {item.detectedTask}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.inputType}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {formatConfidence(item.confidence)}
                  </span>
                </div>

                <p className="text-xs font-semibold text-zinc-200 line-clamp-1">{item.query}</p>
                <p className="text-xs text-zinc-500 line-clamp-2">{item.answer}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-600">
                  <span>Model: {item.modelUsed}</span>
                  <span className="text-zinc-400 flex items-center gap-1">
                    View Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Details Inspector Panel (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            {selectedAnalysis ? (
              <div className="bg-zinc-900 p-5 rounded-xl border border-white/7 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/7 pb-3">
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    Analysis #{((selectedAnalysis as any).id ?? (selectedAnalysis as any)._id ?? '').slice(-8) || 'N/A'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(api.getReportUrl((selectedAnalysis as any).id ?? (selectedAnalysis as any)._id ?? ''), '_blank')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-white/8"
                    >
                      <Download className="w-3 h-3 text-zinc-400" />
                      <span>Download TXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(selectedAnalysis)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-white/8"
                    >
                      <Download className="w-3 h-3 text-zinc-400" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase font-semibold">
                    Original Query:
                  </span>
                  <p className="text-xs text-zinc-200 font-medium">{selectedAnalysis.query}</p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold">
                    Synthesized Response:
                  </span>
                  <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {selectedAnalysis.answer}
                  </p>
                </div>

                <ExecutionTrace steps={selectedAnalysis.executionTrace} />
              </div>
            ) : (
              <div className="bg-zinc-900 p-8 rounded-xl border border-white/5 text-center text-xs text-zinc-600">
                Select an analysis record on the left to inspect its full trace and artifacts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
