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
        <label className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
          Natural-Language Query
        </label>
        <span className="text-[10px] text-zinc-600 font-mono">Press Enter to Run</span>
      </div>

      {/* Input box */}
      <div className="relative rounded-xl bg-zinc-900 border border-white/8 focus-within:border-zinc-500 transition-all">
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SatQuery anything about your satellite imagery (e.g., 'What changed between these dates?')..."
          className="w-full bg-transparent px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none font-sans"
          disabled={isLoading}
        />

        {/* Bottom bar inside input */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/80 rounded-b-xl border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
            <Terminal className="w-3 h-3 text-zinc-500" />
            <span>Agentic Router: Active</span>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || isLoading || !query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-zinc-900 font-semibold text-xs transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-zinc-900" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Suggestions / Preset Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-zinc-500" />
          Recommended Queries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {getQueryChips().map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(chip)}
              className="text-left px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-white/12 hover:bg-zinc-800/80 text-[11px] text-zinc-400 transition-all font-sans leading-tight"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
