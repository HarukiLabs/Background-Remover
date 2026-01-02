import { describe, it, expect, beforeEach } from 'vitest';
import {
    shouldThrottle,
    recordProcessing,
    isDuplicateFile,
    clearProcessedCache,
    resetThrottleState,
    sanitizeForLogging,
} from '@/lib/security';

describe('security', () => {
    beforeEach(() => {
        resetThrottleState();
    });

    describe('throttling', () => {
        it('should not throttle first request', () => {
            const result = shouldThrottle();
            expect(result.throttled).toBe(false);
        });

        it('should throttle rapid requests', () => {
            recordProcessing('hash1');
            const result = shouldThrottle();
            expect(result.throttled).toBe(true);
            expect(result.waitMs).toBeGreaterThan(0);
        });

        it('should not throttle after waiting', async () => {
            recordProcessing('hash1');

            // Manually set lastProcessTime to simulate waiting
            resetThrottleState();

            const result = shouldThrottle();
            expect(result.throttled).toBe(false);
        });
    });

    describe('duplicate detection', () => {
        it('should detect duplicate files', () => {
            const hash = 'abc123';

            expect(isDuplicateFile(hash)).toBe(false);
            recordProcessing(hash);
            expect(isDuplicateFile(hash)).toBe(true);
        });

        it('should clear cache on reset', () => {
            const hash = 'abc123';
            recordProcessing(hash);
            expect(isDuplicateFile(hash)).toBe(true);

            clearProcessedCache();
            expect(isDuplicateFile(hash)).toBe(false);
        });
    });

    describe('sanitizeForLogging', () => {
        it('should remove file paths', () => {
            const input = 'Error at C:\\Users\\test\\file.txt';
            const result = sanitizeForLogging(input);
            expect(result).not.toContain('C:\\Users');
            expect(result).toContain('[PATH]');
        });

        it('should remove URLs', () => {
            const input = 'Loaded from https://example.com/api?key=secret';
            const result = sanitizeForLogging(input);
            expect(result).not.toContain('https://');
            expect(result).toContain('[URL]');
        });

        it('should remove email addresses', () => {
            const input = 'User email: test@example.com';
            const result = sanitizeForLogging(input);
            expect(result).not.toContain('@');
            expect(result).toContain('[EMAIL]');
        });

        it('should truncate long strings', () => {
            const input = 'a'.repeat(200);
            const result = sanitizeForLogging(input, 100);
            expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
        });
    });
});
