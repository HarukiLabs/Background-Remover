
/**
 * Convert an image blob to a specific format with optional background color
 */
export async function convertFormat(
    imageBlob: Blob,
    targetFormat: 'png' | 'jpg' | 'jpeg',
    backgroundColor?: string
): Promise<Blob> {
    // Create bitmap from blob
    const img = await createImageBitmap(imageBlob);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // For JPG/JPEG, add background color (default white)
    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
        ctx.fillStyle = backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Determine settings
    const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
    const quality = targetFormat === 'png' ? undefined : 0.92;

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Conversion failed'));
            },
            mimeType,
            quality
        );
    });
}

/**
 * Generate a filename with appropriate extension and options
 */
export function generateFilename(
    originalName: string,
    format: 'png' | 'jpg' | 'jpeg',
    suffix: string = '_nobg'
): string {
    // Strip extension
    const nameParts = originalName.split('.');
    if (nameParts.length > 1) nameParts.pop();
    const baseName = nameParts.join('.');

    // Sanitize
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 100);

    return `${safeName}${suffix}.${format}`;
}
