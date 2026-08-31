'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Layers, Globe, Terminal } from 'lucide-react';
import { RegisteredModel } from '../../types';
import { api } from '../../lib/api';
import { ModelStatusBadge } from '../../components/ModelStatusBadge';

export default function ModelsPage() {
  const [models, setModels] = useState<RegisteredModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const data = await api.getModels();
      setModels(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      // Default offline placeholder list
      setModels([
        {
          id: 'rs-vqa',
          name: 'Remote Sensing VQA',
          tasks: ['VQA' as any],
          modalities: ['SINGLE_IMAGE' as any],
          modelIdentifier: 'configured via VQA_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Specialist Visual Question Answering adapter for multi-spectral remote sensing imagery.',
          fallbackAvailable: true,
        },
        {
          id: 'rs-caption',
          name: 'Remote Sensing Captioning',
          tasks: ['CAPTION' as any],
          modalities: ['SINGLE_IMAGE' as any],
          modelIdentifier: 'configured via CAPTION_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Automated scene description and structural feature summarization.',
          fallbackAvailable: true,
        },
        {
          id: 'rs-grounding',
          name: 'Remote Sensing Grounding',
          tasks: ['GROUNDING' as any],
          modalities: ['SINGLE_IMAGE' as any],
          modelIdentifier: 'configured via GROUNDING_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Text-guided spatial region identification with bounding box extraction.',
          fallbackAvailable: true,
        },
        {
          id: 'change-detection',
          name: 'Change Detection Model',
          tasks: ['CHANGE_ANALYSIS' as any],
          modalities: ['BI_TEMPORAL' as any],
          modelIdentifier: 'configured via CHANGE_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Bi-temporal feature delta estimation and change mask generation.',
          fallbackAvailable: true,
        },
        {
          id: 'change-vqa',
          name: 'Change VQA Model',
          tasks: ['CHANGE_VQA' as any],
          modalities: ['BI_TEMPORAL' as any],
          modelIdentifier: 'configured via CHANGE_VQA_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Question answering specifically targeted on temporal image pairs.',
          fallbackAvailable: true,
        },
        {
          id: 'optical-sar-fusion',
          name: 'Optical-SAR Fusion Model',
          tasks: ['OPTICAL_SAR_ANALYSIS' as any],
          modalities: ['OPTICAL_SAR' as any],
          modelIdentifier: 'configured via OPTICAL_SAR_MODEL_ID',
          status: 'unavailable' as any,
          description: 'Cross-modal synergy extraction combining Optical RGB with SAR microwave backscatter.',
          fallbackAvailable: true,
        },
      ]);
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/6 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-zinc-500" />
            <span>Model Registry & Status Dashboard</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Live catalog of pretrained remote-sensing specialist models and fallback general AI providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-zinc-600">
              Updated: {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            onClick={fetchModels}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-white/8 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-400' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Grid of Specialist Remote-Sensing Models */}
      <div>
        <h2 className="text-sm font-mono uppercase text-zinc-500 font-semibold tracking-wider mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          Pretrained Remote-Sensing Specialist Models ({models.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-zinc-900 p-5 rounded-xl border border-white/7 flex flex-col justify-between gap-4 hover:border-white/15 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-tight">
                    {model.name}
                  </span>
                  <ModelStatusBadge status={model.status} />
                </div>

                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>Supported Tasks:</span>
                  <span className="text-zinc-300 font-semibold">{model.tasks.join(', ')}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-500">
                  <span>Input Modality:</span>
                  <span className="text-zinc-300">{model.modalities.join(', ')}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-500">
                  <span>Config Key:</span>
                  <span className="text-zinc-600 truncate max-w-[160px]">{model.modelIdentifier}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-500">
                  <span>Fallback Active:</span>
                  <span className="text-emerald-400">✓ Enabled</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
