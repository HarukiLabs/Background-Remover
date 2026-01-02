import { describe, it, expect, vi } from 'vitest';
import { detectDeviceCapabilities, getPerformanceWarning } from '@/lib/deviceDetection';

describe('deviceDetection', () => {
    describe('detectDeviceCapabilities', () => {
        it('should detect WebWorker support', () => {
            const capabilities = detectDeviceCapabilities();
            expect(typeof capabilities.hasWebWorker).toBe('boolean');
        });

        it('should detect WASM support', () => {
            const capabilities = detectDeviceCapabilities();
            expect(typeof capabilities.hasWasm).toBe('boolean');
        });

        it('should return canProcess based on WASM', () => {
            const capabilities = detectDeviceCapabilities();
            expect(capabilities.canProcess).toBe(capabilities.hasWasm);
        });
    });

    describe('getPerformanceWarning', () => {
        it('should return null for capable device', () => {
            const capabilities = {
                hasWebWorker: true,
                hasWasm: true,
                isLowMemory: false,
                isSlowCPU: false,
                canProcess: true,
            };

            expect(getPerformanceWarning(capabilities)).toBeNull();
        });

        it('should warn about missing WASM', () => {
            const capabilities = {
                hasWebWorker: true,
                hasWasm: false,
                isLowMemory: false,
                isSlowCPU: false,
                canProcess: false,
            };

            const warning = getPerformanceWarning(capabilities);
            expect(warning).toContain('WebAssembly');
        });

        it('should warn about low memory', () => {
            const capabilities = {
                hasWebWorker: true,
                hasWasm: true,
                isLowMemory: true,
                isSlowCPU: false,
                canProcess: true,
            };

            const warning = getPerformanceWarning(capabilities);
            expect(warning).toContain('memory');
        });

        it('should warn about slow CPU', () => {
            const capabilities = {
                hasWebWorker: true,
                hasWasm: true,
                isLowMemory: false,
                isSlowCPU: true,
                canProcess: true,
            };

            const warning = getPerformanceWarning(capabilities);
            expect(warning).toContain('longer');
        });

        it('should warn about both low memory and slow CPU', () => {
            const capabilities = {
                hasWebWorker: true,
                hasWasm: true,
                isLowMemory: true,
                isSlowCPU: true,
                canProcess: true,
            };

            const warning = getPerformanceWarning(capabilities);
            expect(warning).toContain('slow performance');
        });
    });
});
