/**
 * Image Compressor Utility
 * Pre-compresses images before AI processing to reduce memory usage
 * and improve processing speed
 */

export interface CompressionOptions {
    maxDimension?: number;
    quality?: number;
    onProgress?: (percent: number) => void;
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for dimension check'));
        };

        img.src = url;
    });
}

/**
 * Compress an image file before processing
 * Uses OffscreenCanvas when available for better performance
 */
export async function compressForProcessing(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const {
        maxDimension = 2048,
        quality = 0.9,
        onProgress
    } = options;

    onProgress?.(0);

    // Get original dimensions
    const dimensions = await getImageDimensions(file);

    // Check if compression is needed
    const needsResize = dimensions.width > maxDimension || dimensions.height > maxDimension;
    const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB

    if (!needsResize && !isLargeFile) {
        onProgress?.(100);
        return file;
    }

    onProgress?.(10);

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = dimensions.width;
    let newHeight = dimensions.height;

    if (needsResize) {
        const ratio = Math.min(maxDimension / dimensions.width, maxDimension / dimensions.height);
        newWidth = Math.round(dimensions.width * ratio);
        newHeight = Math.round(dimensions.height * ratio);
    }

    onProgress?.(20);

    // Create image bitmap for better performance
    const imageBitmap = await createImageBitmap(file);

    onProgress?.(40);

    // Use OffscreenCanvas if available (better for workers)
    const useOffscreen = typeof OffscreenCanvas !== 'undefined';

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    if (useOffscreen) {
        canvas = new OffscreenCanvas(newWidth, newHeight);
        ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } else {
        canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Enable high-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw scaled image
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

    onProgress?.(70);

    // Convert to blob
    let blob: Blob;

    if (useOffscreen) {
        blob = await (canvas as OffscreenCanvas).convertToBlob({
            type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            quality: file.type === 'image/png' ? undefined : quality
        });
    } else {
        blob = await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
                (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
                file.type === 'image/png' ? 'image/png' : 'image/jpeg',
                quality
            );
        });
    }

    onProgress?.(90);

    // Create new File with original name
    const compressedFile = new File([blob], file.name, {
        type: blob.type,
        lastModified: Date.now()
    });

    // Clean up
    imageBitmap.close();

    onProgress?.(100);

    console.log(`📦 Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${dimensions.width}x${dimensions.height} → ${newWidth}x${newHeight})`);

    return compressedFile;
}

/**
 * Check if image needs compression
 */
export function shouldCompress(file: File): boolean {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    return file.size > MAX_SIZE;
}

/**
 * Estimate compression ratio based on file type and size
 */
export function estimateCompressedSize(file: File): number {
    const ratio = file.type === 'image/png' ? 0.4 : 0.6;
    return Math.round(file.size * ratio);
}
