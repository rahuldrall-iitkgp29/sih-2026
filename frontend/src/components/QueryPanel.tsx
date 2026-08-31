'use client';

import React from 'react';
import { Send, Sparkles, MessageSquare, Terminal } from 'lucide-react';
import { InputType } from '../types';

interface QueryPanelProps {
  query: string;
  setQuery: (query: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  inputType: InputType;
  disabled: boolean;
}

export const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  setQuery,
  onAnalyze,
  isLoading,
  inputType,
  disabled,
}) => {
  // Dynamic contextual query chips based on the selected modality
  const getQueryChips = () => {
    switch (inputType) {
      case InputType.SINGLE_IMAGE:
        return [
          'Describe the land-cover and major objects visible in this image.',
          'Describe this image.',
          'Where is the water body?',
          'What objects and transport corridors are visible?',
          'Estimate the vegetation density in this region.',
        ];
      case InputType.BI_TEMPORAL:
        return [
          'What changed between these two dates, and where did the change occur?',
          'Has the built-up area increased, decreased, or remained unchanged?',
          'Identify deforested regions between T1 and T2.',
          'Where did new construction or road expansions take place?',
        ];
      case InputType.OPTICAL_SAR:
        return [
          'Use the optical and SAR images together to identify built-up and water-covered regions.',
          'Compare optical reflectance with SAR backscatter to locate dense structures.',
          'Identify specular water surfaces visible in SAR.',
          'Extract complementary geospatial features from both modalities.',
        ];
      default:
        return [];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && query.trim()) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          Natural-Language Query
        </label>
        <span className="text-[10px] text-slate-500 font-mono">Press Enter to Run</span>
      </div>

      {/* Input box */}
      <div className="relative rounded-xl glass-panel border border-white/10 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SatQuery anything about your satellite imagery (e.g., 'What changed between these dates?')..."
          className="w-full bg-transparent px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none font-sans"
          disabled={isLoading}
        />

        {/* Bottom bar inside input */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 rounded-b-xl border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>Agentic Router: Active</span>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || isLoading || !query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-slate-950" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Suggestions / Preset Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Recommended Queries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {getQueryChips().map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(chip)}
              className="text-left px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800 text-[11px] text-slate-300 transition-all font-sans leading-tight"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
