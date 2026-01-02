/// <reference lib="webworker" />

import { removeBackground, Config } from '@imgly/background-removal';

// Worker state
let isReady = false;

// Handle messages from main thread
self.onmessage = async (event: MessageEvent) => {
    const { type } = event.data;

    switch (type) {
        case 'init':
            await handleInit();
            break;
        case 'process':
            await handleProcess(event.data.imageData, event.data.mimeType);
            break;
        default:
            self.postMessage({
                type: 'error',
                message: `Unknown message type: ${type}`,
                retryable: false,
            });
    }
};

async function handleInit(): Promise<void> {
    try {
        // Pre-warm the model by loading configuration
        isReady = true;
        self.postMessage({ type: 'ready' });
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: 'Failed to initialize background removal model',
            retryable: true,
        });
    }
}

async function handleProcess(imageData: ArrayBuffer, mimeType: string): Promise<void> {
    if (!isReady) {
        self.postMessage({
            type: 'error',
            message: 'Worker not initialized',
            retryable: true,
        });
        return;
    }

    try {
        // Create blob from array buffer
        const blob = new Blob([imageData], { type: mimeType });

        // Configure background removal
        const config: Config = {
            progress: (key: string, current: number, total: number) => {
                const percent = Math.round((current / total) * 100);
                let stage = 'Processing';

                if (key.includes('model')) {
                    stage = 'Loading model';
                } else if (key.includes('inference')) {
                    stage = 'Removing background';
                } else if (key.includes('mask')) {
                    stage = 'Creating mask';
                }

                self.postMessage({
                    type: 'progress',
                    percent,
                    stage,
                });
            },
            output: {
                format: 'image/png',
                quality: 0.9,
            },
        };

        // Process the image
        const resultBlob = await removeBackground(blob, config);

        // Send result back
        self.postMessage({
            type: 'complete',
            resultBlob,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isWasmError = errorMessage.toLowerCase().includes('wasm') ||
            errorMessage.toLowerCase().includes('webassembly');

        self.postMessage({
            type: 'error',
            message: isWasmError
                ? 'WebAssembly failed to load. Your browser may not support this feature.'
                : `Failed to process image: ${errorMessage}`,
            retryable: !isWasmError,
        });
    }
}

export { };
