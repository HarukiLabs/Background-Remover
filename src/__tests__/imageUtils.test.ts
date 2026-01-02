import { describe, it, expect } from 'vitest';
import { validateImageFile, getExtensionFromMimeType } from '@/lib/imageUtils';

describe('imageUtils', () => {
    describe('validateImageFile', () => {
        it('should accept valid JPEG file', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid PNG file', () => {
            const file = new File([''], 'test.png', { type: 'image/png' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 });

            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid WebP file', () => {
            const file = new File([''], 'test.webp', { type: 'image/webp' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 });

            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid file type', () => {
            const file = new File([''], 'test.gif', { type: 'image/gif' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 });

            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });

        it('should reject file larger than 10MB', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('too large');
        });

        it('should accept file exactly 10MB', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });
    });

    describe('getExtensionFromMimeType', () => {
        it('should return jpg for image/jpeg', () => {
            expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
        });

        it('should return png for image/png', () => {
            expect(getExtensionFromMimeType('image/png')).toBe('png');
        });

        it('should return webp for image/webp', () => {
            expect(getExtensionFromMimeType('image/webp')).toBe('webp');
        });

        it('should return png for unknown type', () => {
            expect(getExtensionFromMimeType('image/unknown')).toBe('png');
        });
    });
});
