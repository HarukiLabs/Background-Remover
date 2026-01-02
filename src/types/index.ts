// Image file state
export interface ImageFile {
  file: File;
  preview: string;
  hash?: string;
}

// Processing status
export type ProcessingStatus = 
  | 'idle'
  | 'loading-model'
  | 'processing'
  | 'complete'
  | 'error';

// Processing progress data
export interface ProcessingProgress {
  percent: number;
  stage: string;
  estimatedTimeRemaining?: number;
}

// Processing state
export interface ProcessingState {
  status: ProcessingStatus;
  progress: ProcessingProgress | null;
  result: string | null;
  error: string | null;
  isRetryable: boolean;
}

// Device capabilities
export interface DeviceCapabilities {
  hasWebWorker: boolean;
  hasWasm: boolean;
  isLowMemory: boolean;
  isSlowCPU: boolean;
  canProcess: boolean;
}

// Worker message types
export type WorkerMessage =
  | { type: 'init' }
  | { type: 'process'; imageData: ArrayBuffer; mimeType: string };

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'progress'; percent: number; stage: string }
  | { type: 'complete'; resultBlob: Blob }
  | { type: 'error'; message: string; retryable: boolean };

// Throttle state
export interface ThrottleState {
  lastProcessTime: number;
  processedHashes: Set<string>;
}

// Component props
export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export interface ImageComparisonProps {
  originalSrc: string;
  processedSrc: string;
}

export interface ActionButtonsProps {
  onProcess: () => void;
  onDownload: () => void;
  onReset: () => void;
  canProcess: boolean;
  canDownload: boolean;
  isProcessing: boolean;
}

export interface LoadingSpinnerProps {
  progress: ProcessingProgress;
}

export interface StatusMessageProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}
