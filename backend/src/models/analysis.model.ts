import mongoose, { Schema, Document } from 'mongoose';
import { InputType, TaskType, ModelSource } from '../types';

export interface IAnalysis extends Document {
  query: string;
  inputType: InputType;
  images: {
    id: string;
    filename: string;
    originalName: string;
    format: string;
    width: number | null;
    height: number | null;
    bands: number | null;
  }[];
  detectedTask: TaskType;
  modelsUsed: string[];
  modelSource: ModelSource;
  toolsUsed: string[];
  answer: string;
  confidence: number;
  evidence: {
    type: string;
    data: any;
    description: string;
  }[];
  executionTrace: {
    step: number;
    name: string;
    status: string;
    duration: number;
    detail: string;
  }[];
  processingTime: number;
  createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    query: { type: String, required: true },
    inputType: { type: String, enum: Object.values(InputType), required: true },
    images: [
      {
        id: String,
        filename: String,
        originalName: String,
        format: String,
        width: Number,
        height: Number,
        bands: Number,
      },
    ],
    detectedTask: { type: String, enum: Object.values(TaskType), required: true },
    modelsUsed: [String],
    modelSource: { type: String, enum: Object.values(ModelSource), default: ModelSource.FALLBACK },
    toolsUsed: [String],
    answer: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    evidence: [
      {
        type: String,
        data: Schema.Types.Mixed,
        description: String,
      },
    ],
    executionTrace: [
      {
        step: Number,
        name: String,
        status: String,
        duration: Number,
        detail: String,
      },
    ],
    processingTime: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ createdAt: -1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema);
