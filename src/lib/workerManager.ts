import { ProcessingProgress } from '@/types';
import { detectDeviceCapabilities } from './deviceDetection';
import { blobToDataURL } from './imageUtils';

type ProgressCallback = (progress: ProcessingProgress) => void;
type CompleteCallback = (resultDataUrl: string) => void;
type ErrorCallback = (message: string, retryable: boolean) => void;

let worker: Worker | null = null;
let isWorkerReady = false;
let useMainThread = false;
let currentCallbacks: {
    onProgress?: ProgressCallback;
    onComplete?: CompleteCallback;
    onError?: ErrorCallback;
} = {};

/**
 * Initialize the background removal worker
 */
export async function initWorker(): Promise<boolean> {
    const capabilities = detectDeviceCapabilities();

    if (!capabilities.hasWebWorker) {
        console.log('Web Workers not supported, will use main thread');
        useMainThread = true;
        return false;
    }

    // For now, use main thread processing as it's more reliable
    // The @imgly/background-removal library handles its own worker internally
    useMainThread = true;
    return false;
}

/**
 * Process an image - uses main thread with the library's internal optimization
 */
export async function processWithWorker(
    file: File,
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onError: ErrorCallback
): Promise<void> {
    currentCallbacks = { onProgress, onComplete, onError };
    await processOnMainThread(file, onProgress, onComplete, onError);
}

/**
 * Process on main thread - the library handles its own optimizations
 */
async function processOnMainThread(
    file: File,
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onError: ErrorCallback
): Promise<void> {
    try {
        // Dynamic import to lazy load the library
        const { removeBackground } = await import('@imgly/background-removal');

        onProgress({ percent: 5, stage: 'Loading AI model...' });

        const resultBlob = await removeBackground(file, {
            progress: (key: string, current: number, total: number) => {
                const percent = Math.min(95, Math.round((current / total) * 100));
                let stage = 'Processing...';

                if (key.includes('fetch') || key.includes('load')) {
                    stage = 'Loading AI model...';
                } else if (key.includes('inference')) {
                    stage = 'Removing background...';
                } else if (key.includes('mask')) {
                    stage = 'Creating mask...';
                }

                onProgress({ percent, stage });
            },
            output: {
                format: 'image/png',
                quality: 0.9,
            },
        });

        onProgress({ percent: 100, stage: 'Complete!' });

        const dataUrl = await blobToDataURL(resultBlob);
        onComplete(dataUrl);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isWasmError = errorMessage.toLowerCase().includes('wasm') ||
            errorMessage.toLowerCase().includes('webassembly');

        onError(
            isWasmError
                ? 'WebAssembly failed to load. Your browser may not support this feature.'
                : `Failed to process image: ${errorMessage}`,
            !isWasmError
        );
    }
}

/**
 * Terminate the worker
 */
export function terminateWorker(): void {
    if (worker) {
        worker.terminate();
        worker = null;
        isWorkerReady = false;
    }
}

/**
 * Check if worker is ready
 */
export function isWorkerAvailable(): boolean {
    return isWorkerReady;
}
