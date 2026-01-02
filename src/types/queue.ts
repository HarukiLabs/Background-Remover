import { ProcessingMode } from '@/lib/editor/EditorState';

export type QueueItemStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface QueueItemState {
    id: string;
    name: string;
    size: number;
    type: string;
    thumbnailUrl?: string; // Blob URL for UI display
    status: QueueItemStatus;
    progress: number;
    error?: string;
    originalWidth?: number;
    originalHeight?: number;
    processingMode: ProcessingMode;
    editorStateId?: string; // Reference to EditorState in IDB
    quickSettings?: Record<string, any>;
}

export interface QueueContextType {
    queue: QueueItemState[];
    isProcessing: boolean;
    workerStats: {
        activeWorkers: number;
        completed: number;
        total: number;
    };
    addFiles: (files: File[]) => Promise<void>;
    removeFile: (id: string) => Promise<void>;
    processQueue: (itemIds?: string[]) => void;
    cancelItem: (id: string) => void;
    clearQueue: () => Promise<void>;
    updateItemState: (id: string, updates: Partial<QueueItemState>) => void;
    saveEditedImage: (id: string, newBlob: Blob) => Promise<void>;
    // Selection Management
    selectedItems: Set<string>;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    // Processing Mode
    globalProcessingMode: ProcessingMode;
    setGlobalProcessingMode: (mode: ProcessingMode, quickSettings?: Record<string, any>) => void;
    globalQuickSettings: Record<string, any>;
}
