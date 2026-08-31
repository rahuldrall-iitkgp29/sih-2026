import React from 'react';
import { ShieldCheck, Cpu, Terminal, Satellite } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-slate-950/60 py-8 px-4 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-slate-300 font-semibold">SatQuery AI</span>
          <span>— Smart India Hackathon 2026 Internal Round Prototype</span>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Node.js + LangChain
          </span>
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            FastAPI RS Serving
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Multi-Modal Geo-Inference
          </span>
        </div>
      </div>
    </footer>
  );
};
