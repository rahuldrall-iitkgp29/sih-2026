'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileImage, Trash2, CheckCircle2, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';
import { ImageMetadata, InputType } from '../types';
import { formatBytes } from '../lib/utils';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

interface ImageUploaderProps {
  inputType: InputType;
  setInputType: (type: InputType) => void;
  images: ImageMetadata[];
  setImages: (images: ImageMetadata[]) => void;
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  onSelectDemoScenario: (scenarioId: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  inputType,
  setInputType,
  images,
  setImages,
  onFilesSelected,
  isUploading,
  onSelectDemoScenario,
}) => {
  const maxImages = inputType === InputType.SINGLE_IMAGE ? 1 : 2;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles.slice(0, maxImages - images.length));
      }
    },
    [images.length, maxImages, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.geotiff'],
    },
    maxFiles: maxImages,
    disabled: isUploading || images.length >= maxImages,
  });

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const getSlotLabel = (index: number) => {
    if (inputType === InputType.SINGLE_IMAGE) return 'Target Optical / Satellite Scene';
    if (inputType === InputType.BI_TEMPORAL) return index === 0 ? 'T1: Historical / Before Image' : 'T2: Current / After Image';
    if (inputType === InputType.OPTICAL_SAR) return index === 0 ? 'Modality 1: Optical RGB Sensor' : 'Modality 2: SAR Microwave Sensor (C/L-Band)';
    return `Image ${index + 1}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Modality Selector Tabs */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider flex items-center justify-between">
          <span>Analysis Workflow</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            Max {maxImages} {maxImages === 1 ? 'image' : 'images'}
          </span>
        </label>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 rounded-lg border border-white/6">
          <button
            type="button"
            onClick={() => {
              setInputType(InputType.SINGLE_IMAGE);
              if (images.length > 1) setImages([images[0]]);
            }}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
              inputType === InputType.SINGLE_IMAGE
                ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Single Image</span>
          </button>

          <button
            type="button"
            onClick={() => setInputType(InputType.BI_TEMPORAL)}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
              inputType === InputType.BI_TEMPORAL
                ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bi-Temporal</span>
          </button>

          <button
            type="button"
            onClick={() => setInputType(InputType.OPTICAL_SAR)}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
              inputType === InputType.OPTICAL_SAR
                ? 'bg-zinc-700 text-zinc-100 border border-zinc-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optical + SAR</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragActive
              ? 'border-zinc-400 bg-zinc-900/60'
              : 'border-white/10 bg-zinc-900/30 hover:border-zinc-500/60 hover:bg-zinc-900/60'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-200">
              {isDragActive
                ? 'Drop remote-sensing imagery here'
                : `Upload ${getSlotLabel(images.length)}`}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Supports <span className="text-zinc-300 font-mono">GeoTIFF</span>, TIFF, PNG, JPEG (Up to 50MB)
            </p>
          </div>
        </div>
      )}

      {/* Uploaded Images List */}
      {images.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider">
            Loaded Remote-Sensing Inputs ({images.length}/{maxImages})
          </label>

          {images.map((img, idx) => (
            <div
              key={img.id}
              className="bg-zinc-900/80 p-3 rounded-xl flex items-center justify-between gap-3 border border-white/7 hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-white/8 overflow-hidden flex-shrink-0 relative">
                  {img.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.previewUrl}
                      alt={img.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-6 h-6 text-zinc-600 m-auto mt-3" />
                  )}
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 font-semibold uppercase">
                      {img.format || 'GeoTIFF'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono truncate">
                      {getSlotLabel(idx)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-200 truncate mt-0.5" title={img.originalName}>
                    {img.originalName}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(img.size)}</span>
                    {img.width && img.height && (
                      <span>• {img.width}×{img.height} px</span>
                    )}
                    {img.bands && <span>• {img.bands} Bands</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Remove Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
