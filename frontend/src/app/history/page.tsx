'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Search, Filter, Download, ArrowRight, Layers, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { AnalysisResult, TaskType } from '../../types';
import { api } from '../../lib/api';
import { formatConfidence } from '../../lib/utils';
import { ExecutionTrace } from '../../components/ExecutionTrace';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Analysis History & Audit Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse previous remote-sensing analyses, view execution traces, and download verification reports.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-all self-start sm:self-auto"
        >
          <span>New Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries, tasks, answers..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {['ALL', 'VQA', 'CAPTION', 'CHANGE_ANALYSIS', 'OPTICAL_SAR_ANALYSIS'].map((task) => (
            <button
              key={task}
              type="button"
              onClick={() => setSelectedTask(task)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${
                selectedTask === task
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Empty State */}
      {isLoading ? (
        <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Retrieving analysis records from database...</span>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center flex flex-col items-center justify-center gap-3">
          <Layers className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No Past Analyses Recorded</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Execute analyses in the Dashboard workspace. All runs are automatically indexed with complete auditable execution traces.
          </p>
          <Link
            href="/"
            className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 to-blue-600 text-slate-950 text-xs font-semibold"
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
                key={item.id}
                onClick={() => setSelectedAnalysis(item)}
                className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  selectedAnalysis?.id === item.id
                    ? 'border-cyan-500/60 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold uppercase">
                      {item.detectedTask}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.inputType}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {formatConfidence(item.confidence)}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{item.query}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{item.answer}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
                  <span>Model: {item.modelUsed}</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    View Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Details Inspector Panel (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            {selectedAnalysis ? (
              <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Analysis #{selectedAnalysis.id.slice(-8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.open(api.getReportUrl(selectedAnalysis.id), '_blank')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-white/10"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>Download TXT</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                    Original Query:
                  </span>
                  <p className="text-xs text-slate-200 font-medium">{selectedAnalysis.query}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    Synthesized Response:
                  </span>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedAnalysis.answer}
                  </p>
                </div>

                <ExecutionTrace steps={selectedAnalysis.executionTrace} />
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center text-xs text-slate-500">
                Select an analysis record on the left to inspect its full trace and artifacts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
