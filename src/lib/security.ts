import { ThrottleState } from '@/types';

// Minimum time between processing requests (3 seconds)
const THROTTLE_INTERVAL_MS = 3000;

// Global throttle state
let throttleState: ThrottleState = {
    lastProcessTime: 0,
    processedHashes: new Set<string>(),
};

/**
 * Check if a processing request should be throttled
 */
export function shouldThrottle(): { throttled: boolean; waitMs?: number } {
    const now = Date.now();
    const timeSinceLastProcess = now - throttleState.lastProcessTime;

    if (timeSinceLastProcess < THROTTLE_INTERVAL_MS) {
        return {
            throttled: true,
            waitMs: THROTTLE_INTERVAL_MS - timeSinceLastProcess,
        };
    }

    return { throttled: false };
}

/**
 * Record a processing request
 */
export function recordProcessing(hash: string): void {
    throttleState.lastProcessTime = Date.now();
    throttleState.processedHashes.add(hash);
}

/**
 * Check if a file has already been processed in this session
 */
export function isDuplicateFile(hash: string): boolean {
    return throttleState.processedHashes.has(hash);
}

/**
 * Clear processed files cache (for reset functionality)
 */
export function clearProcessedCache(): void {
    throttleState.processedHashes.clear();
}

/**
 * Reset all throttle state
 */
export function resetThrottleState(): void {
    throttleState = {
        lastProcessTime: 0,
        processedHashes: new Set<string>(),
    };
}

/**
 * Sanitize a string for safe logging (remove potential sensitive data)
 */
export function sanitizeForLogging(input: string, maxLength: number = 100): string {
    // Remove potential file paths
    let sanitized = input.replace(/[A-Za-z]:\\[^\s]+/g, '[PATH]');

    // Remove potential URLs with query params
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL]');

    // Remove potential email addresses
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');

    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength) + '...';
    }

    return sanitized;
}

/**
 * Safe console log that sanitizes user data
 */
export function safeLog(message: string, data?: unknown): void {
    const sanitizedMessage = sanitizeForLogging(message);

    if (data !== undefined) {
        // Don't log the actual data, just indicate type
        console.log(sanitizedMessage, `[${typeof data}]`);
    } else {
        console.log(sanitizedMessage);
    }
}

/**
 * Safe error log
 */
export function safeError(message: string, error?: unknown): void {
    const sanitizedMessage = sanitizeForLogging(message);

    if (error instanceof Error) {
        console.error(sanitizedMessage, sanitizeForLogging(error.message));
    } else {
        console.error(sanitizedMessage);
    }
}
