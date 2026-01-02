/**
 * Image Processing Functions
 * - Remove Background (AI-based)
 * - Remove Specific Color (Chroma Key)
 * - Blur Background
 * 
 * Performance optimizations:
 * - Image compression before AI processing for large files
 * - OffscreenCanvas usage where available
 * - Progress callbacks for long operations
 */

import { removeBackground } from '@imgly/background-removal';
import { compressForProcessing, shouldCompress } from './imageCompressor';

// ============================================
// MODE 1: REMOVE BACKGROUND ONLY (AI)
// ============================================
export async function removeBackgroundOnly(file: File): Promise<Blob> {
    console.log('🔄 Starting: Remove Background Only (AI)');

    // Compress large images before processing for better performance
    let processFile = file;
    if (shouldCompress(file)) {
        console.log('📦 Compressing large file before processing...');
        processFile = await compressForProcessing(file, { maxDimension: 2048 });
    }

    const result = await removeBackground(processFile);
    console.log('✅ Background removed successfully');
    return result;
}

// ============================================
// MODE 2: REMOVE SPECIFIC COLOR (CHROMA KEY)
// Like green screen removal - removes selected color
// Optimized with chunked processing to prevent UI lag
// ============================================
export async function removeSpecificColor(
    file: File,
    targetColor: string,
    tolerance: number = 30
): Promise<Blob> {
    console.log('🔄 Starting: Remove Color (Chroma Key)');
    console.log('   Target color:', targetColor);
    console.log('   Tolerance:', tolerance);

    // Step 1: Load original image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get canvas context');

    const img = await createImageBitmap(file);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Step 2: Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Step 3: Parse target color (hex to RGB)
    const targetR = parseInt(targetColor.slice(1, 3), 16);
    const targetG = parseInt(targetColor.slice(3, 5), 16);
    const targetB = parseInt(targetColor.slice(5, 7), 16);
    console.log('   Target RGB:', targetR, targetG, targetB);

    // Step 4: Process pixels in chunks to prevent blocking
    let removedPixels = 0;
    const toleranceSquared = tolerance * tolerance * 3;
    const CHUNK_SIZE = 50000; // Process 50k pixels per chunk
    const totalPixels = data.length / 4;

    for (let startPixel = 0; startPixel < totalPixels; startPixel += CHUNK_SIZE) {
        const endPixel = Math.min(startPixel + CHUNK_SIZE, totalPixels);

        for (let pixel = startPixel; pixel < endPixel; pixel++) {
            const i = pixel * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate color distance (Euclidean in RGB space)
            const distanceSquared =
                (r - targetR) ** 2 +
                (g - targetG) ** 2 +
                (b - targetB) ** 2;

            // If color matches within tolerance, make transparent
            if (distanceSquared <= toleranceSquared) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
                removedPixels++;
            }
        }

        // Yield to allow UI updates (every chunk)
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Step 5: Put modified data back
    ctx.putImageData(imageData, 0, 0);
    console.log('✅ Removed', removedPixels, 'pixels matching color');

    // Return as PNG with transparency
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    console.log('✅ PNG created with transparent areas');
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            },
            'image/png',
            1.0
        );
    });
}

// ============================================
// MODE 3: BLUR BACKGROUND ONLY
// Subject stays SHARP, Background gets BLURRED
// ============================================
export async function blurBackgroundOnly(
    file: File,
    blurAmount: number
): Promise<Blob> {
    console.log('🔄 Starting: Blur Background Only');
    console.log('   Blur amount:', blurAmount, 'px');

    // Step 1: Get subject mask using AI background removal
    console.log('   Step 1: Getting subject mask...');
    const maskBlob = await removeBackground(file);
    const maskImg = await createImageBitmap(maskBlob);
    console.log('   ✅ Subject mask obtained');

    // Step 2: Create mask canvas for alpha channel
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) throw new Error('Failed to get mask context');

    maskCanvas.width = maskImg.width;
    maskCanvas.height = maskImg.height;
    maskCtx.drawImage(maskImg, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Step 3: Load ORIGINAL image (with background)
    console.log('   Step 2: Loading original image...');
    const originalImg = await createImageBitmap(file);

    // Step 4: Create SHARP version
    const sharpCanvas = document.createElement('canvas');
    const sharpCtx = sharpCanvas.getContext('2d', { willReadFrequently: true });
    if (!sharpCtx) throw new Error('Failed to get sharp context');

    sharpCanvas.width = originalImg.width;
    sharpCanvas.height = originalImg.height;
    sharpCtx.drawImage(originalImg, 0, 0);
    const sharpData = sharpCtx.getImageData(0, 0, sharpCanvas.width, sharpCanvas.height);

    // Step 5: Create BLURRED version
    console.log('   Step 3: Creating blurred version...');
    const blurredCanvas = document.createElement('canvas');
    const blurredCtx = blurredCanvas.getContext('2d', { willReadFrequently: true });
    if (!blurredCtx) throw new Error('Failed to get blurred context');

    blurredCanvas.width = originalImg.width;
    blurredCanvas.height = originalImg.height;
    blurredCtx.filter = `blur(${blurAmount}px)`;
    blurredCtx.drawImage(originalImg, 0, 0);
    blurredCtx.filter = 'none';
    const blurredData = blurredCtx.getImageData(0, 0, blurredCanvas.width, blurredCanvas.height);

    // Step 6: Composite using mask (chunked to prevent lag)
    console.log('   Step 4: Compositing...');
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
    if (!finalCtx) throw new Error('Failed to get final context');

    finalCanvas.width = originalImg.width;
    finalCanvas.height = originalImg.height;
    const finalData = finalCtx.createImageData(finalCanvas.width, finalCanvas.height);

    const CHUNK_SIZE = 50000;
    const totalPixels = maskData.data.length / 4;

    for (let startPixel = 0; startPixel < totalPixels; startPixel += CHUNK_SIZE) {
        const endPixel = Math.min(startPixel + CHUNK_SIZE, totalPixels);

        for (let pixel = startPixel; pixel < endPixel; pixel++) {
            const i = pixel * 4;
            const alpha = maskData.data[i + 3];

            if (alpha > 128) {
                // Subject pixel - use SHARP
                finalData.data[i] = sharpData.data[i];
                finalData.data[i + 1] = sharpData.data[i + 1];
                finalData.data[i + 2] = sharpData.data[i + 2];
                finalData.data[i + 3] = 255;
            } else {
                // Background pixel - use BLURRED
                finalData.data[i] = blurredData.data[i];
                finalData.data[i + 1] = blurredData.data[i + 1];
                finalData.data[i + 2] = blurredData.data[i + 2];
                finalData.data[i + 3] = 255;
            }
        }

        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    finalCtx.putImageData(finalData, 0, 0);
    console.log('✅ Blur applied to background only');

    return new Promise((resolve, reject) => {
        finalCanvas.toBlob(
            (blob) => {
                if (blob) {
                    console.log('✅ Final image created');
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            },
            'image/jpeg',
            0.95
        );
    });
}

// ============================================
// UNIFIED PROCESSOR
// ============================================
export type ProcessingMode = 'remove-bg' | 'remove-color' | 'blur-bg';

export interface ProcessingConfig {
    mode: ProcessingMode;
    colorToRemove?: string;
    colorTolerance?: number;
    blurIntensity?: number;
}

export async function processImage(
    file: File,
    config: ProcessingConfig
): Promise<Blob> {
    switch (config.mode) {
        case 'remove-bg':
            return removeBackgroundOnly(file);

        case 'remove-color':
            return removeSpecificColor(
                file,
                config.colorToRemove || '#00FF00',
                config.colorTolerance || 30
            );

        case 'blur-bg':
            return blurBackgroundOnly(file, config.blurIntensity || 25);

        default:
            throw new Error(`Unknown mode: ${config.mode}`);
    }
}
