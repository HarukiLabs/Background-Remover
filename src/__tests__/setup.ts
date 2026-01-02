import '@testing-library/jest-dom';

// Mock Web APIs not available in jsdom
Object.defineProperty(window, 'crypto', {
    value: {
        subtle: {
            digest: async (algorithm: string, data: ArrayBuffer) => {
                // Simple mock hash for testing
                const view = new Uint8Array(data);
                const hash = new Uint8Array(32);
                for (let i = 0; i < view.length; i++) {
                    hash[i % 32] ^= view[i];
                }
                return hash.buffer;
            },
        },
    },
});

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:mock-url');
URL.revokeObjectURL = jest.fn();

// Mock navigator properties
Object.defineProperty(navigator, 'hardwareConcurrency', {
    value: 4,
    writable: true,
});

Object.defineProperty(navigator, 'deviceMemory', {
    value: 8,
    writable: true,
});
