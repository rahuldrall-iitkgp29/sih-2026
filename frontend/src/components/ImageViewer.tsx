'use client';

import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, SplitSquareVertical, Eye, Layers } from 'lucide-react';
import { AnalysisEvidence, ImageMetadata, InputType } from '../types';

interface ImageViewerProps {
  images: ImageMetadata[];
  inputType: InputType;
  evidence?: AnalysisEvidence[];
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  inputType,
  evidence = [],
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState(50); // percentage for before/after slider
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'single'>('slider');
  const [showOverlays, setShowOverlays] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const hasTwoImages = images.length >= 2;
  const isMultiModal = inputType === InputType.BI_TEMPORAL || inputType === InputType.OPTICAL_SAR;

  const boundingBoxes = evidence.filter((e) => e.type === 'bounding_box');

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-white/10 overflow-hidden relative shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-200">
            {images.length === 0
              ? 'Remote-Sensing Canvas'
              : hasTwoImages
              ? inputType === InputType.BI_TEMPORAL
                ? 'Bi-Temporal Difference Viewer (T1 vs T2)'
                : 'Optical + SAR Cross-Modal Fusion Viewer'
              : `Single Scene: ${images[0]?.originalName}`}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
          {hasTwoImages && isMultiModal && (
            <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  viewMode === 'slider'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split-Slider
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                  viewMode === 'side-by-side'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Side-by-Side
              </button>
            </div>
          )}

          {boundingBoxes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                showOverlays ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Evidence Overlays"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset Canvas View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 bg-slate-950/95 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 gap-3 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-center text-cyan-400/50">
              <Layers className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No Remote-Sensing Imagery Loaded</p>
            <p className="text-xs text-slate-500">
              Upload GeoTIFF, TIFF, or PNG imagery from the left panel or click a Quick Demo dataset below to begin.
            </p>
          </div>
        ) : hasTwoImages && isMultiModal && viewMode === 'slider' ? (
          /* Interactive Split-Screen Slider */
          <div
            className="w-full h-full relative"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Base Image 2 (After or SAR) */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[1].previewUrl}
                alt={images[1].originalName}
                className="max-h-[85%] max-w-[90%] object-contain shadow-2xl rounded-lg"
              />
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-slate-900/90 border border-white/10 text-[11px] font-mono text-amber-400">
                {inputType === InputType.BI_TEMPORAL ? 'T2: Current' : 'SAR Microwave (VV+VH)'}
              </div>
            </div>

            {/* Clipped Image 1 (Before or Optical) */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].previewUrl}
                alt={images[0].originalName}
                className="max-h-[85%] max-w-[90%] object-contain shadow-2xl rounded-lg"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-slate-900/90 border border-white/10 text-[11px] font-mono text-cyan-400">
                {inputType === InputType.BI_TEMPORAL ? 'T1: Historical' : 'Optical RGB Band'}
              </div>
            </div>

            {/* Vertical Split Line Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_#38bdf8] pointer-events-none z-20"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg font-mono text-[10px] font-bold">
                ↔
              </div>
            </div>
          </div>
        ) : hasTwoImages && isMultiModal && viewMode === 'side-by-side' ? (
          /* Side-by-Side Dual View */
          <div
            className="grid grid-cols-2 gap-4 w-full h-full p-6 items-center"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div className="flex flex-col items-center gap-2 h-full justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].previewUrl}
                alt="Image 1"
                className="max-h-[80%] max-w-full object-contain rounded-lg border border-cyan-500/30"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/20">
                {inputType === InputType.BI_TEMPORAL ? 'T1: Reference Date' : 'Modality 1: Optical RGB'}
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 h-full justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[1].previewUrl}
                alt="Image 2"
                className="max-h-[80%] max-w-full object-contain rounded-lg border border-amber-500/30"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/20">
                {inputType === InputType.BI_TEMPORAL ? 'T2: Target Date' : 'Modality 2: SAR Microwave'}
              </span>
            </div>
          </div>
        ) : (
          /* Single Image View */
          <div
            className="relative flex items-center justify-center max-h-[90%] max-w-[90%]"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]?.previewUrl}
              alt="Satellite Scene"
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
            />

            {/* Bounding Box Overlays */}
            {showOverlays &&
              boundingBoxes.map((boxEv, idx) => {
                const box = boxEv.data.box || [20, 20, 60, 60]; // [x_min, y_min, x_max, y_max] percentages
                return (
                  <div
                    key={idx}
                    className="absolute border-2 border-cyan-400 bg-cyan-400/10 rounded pointer-events-none shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    style={{
                      left: `${box[0]}%`,
                      top: `${box[1]}%`,
                      width: `${box[2] - box[0]}%`,
                      height: `${box[3] - box[1]}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold rounded">
                      {boxEv.description || 'Target Region'}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Split Slider Range Controller (when active) */}
      {hasTwoImages && isMultiModal && viewMode === 'slider' && (
        <div className="px-6 py-2 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-4 z-10">
          <span className="text-[11px] font-mono text-cyan-400 whitespace-nowrap">
            {inputType === InputType.BI_TEMPORAL ? 'T1: 100%' : 'Optical: 100%'}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <span className="text-[11px] font-mono text-amber-400 whitespace-nowrap">
            {inputType === InputType.BI_TEMPORAL ? 'T2: 100%' : 'SAR: 100%'}
          </span>
        </div>
      )}
    </div>
  );
};
