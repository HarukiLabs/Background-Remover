import { DeviceCapabilities } from '@/types';

/**
 * Detect device capabilities for processing
 * Checks for WebWorker, WASM support, memory, and CPU cores
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
    const hasWebWorker = typeof Worker !== 'undefined';

    // Check for WebAssembly support
    const hasWasm = (() => {
        try {
            if (typeof WebAssembly === 'object' &&
                typeof WebAssembly.instantiate === 'function') {
                const module = new WebAssembly.Module(
                    Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
                );
                return module instanceof WebAssembly.Module;
            }
            return false;
        } catch {
            return false;
        }
    })();

    // Check for low memory (less than 4GB)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const isLowMemory = deviceMemory !== undefined && deviceMemory < 4;

    // Check for slow CPU (less than 4 cores)
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const isSlowCPU = hardwareConcurrency < 4;

    // Can process if we have WASM (WebWorker is optional, we have fallback)
    const canProcess = hasWasm;

    return {
        hasWebWorker,
        hasWasm,
        isLowMemory,
        isSlowCPU,
        canProcess,
    };
}

/**
 * Get performance warning message based on device capabilities
 */
export function getPerformanceWarning(capabilities: DeviceCapabilities): string | null {
    if (!capabilities.hasWasm) {
        return 'Your browser does not support WebAssembly. Background removal is not available.';
    }

    if (capabilities.isLowMemory && capabilities.isSlowCPU) {
        return 'Your device may experience slow performance. Processing might take longer than usual.';
    }

    if (capabilities.isLowMemory) {
        return 'Low memory detected. Large images may cause issues.';
    }

    if (capabilities.isSlowCPU) {
        return 'Processing may take a bit longer on your device.';
    }

    return null;
}
