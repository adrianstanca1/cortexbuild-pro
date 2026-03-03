// Multimodal content types and interfaces

export enum MediaType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

export interface MultimodalContent {
  id: string;
  type: MediaType;
  content: string | File | Blob;
  metadata?: {
    size?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    mimeType?: string;
    tags?: string[];
    description?: string;
    timestamp?: string;
    location?: { lat: number; lng: number };
  };
  annotations?: {
    confidence: number;
    labels: string[];
    description: string;
    objects?: Array<{
      label: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>;
  };
}

export interface ProcessingResult {
  success: boolean;
  content?: MultimodalContent;
  error?: string;
  processingTime?: number;
  confidence?: number;
}