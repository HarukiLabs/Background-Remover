/**
 * Filter Effects - Canvas-based filter implementations (NOT CSS)
 * All calculations done via pixel manipulation for export-quality output
 */

export interface FilterParams {
    brightness: number;   // -1 to 1
    contrast: number;     // -1 to 1
    saturation: number;   // -1 to 1
    temperature: number;  // -1 (cool) to 1 (warm)
    hue: number;          // 0 to 360
    exposure: number;     // -1 to 1
    vignette: number;     // 0 to 1
    grain: number;        // 0 to 1
    sharpness: number;    // 0 to 1
}

export const DEFAULT_FILTER_PARAMS: FilterParams = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    hue: 0,
    exposure: 0,
    vignette: 0,
    grain: 0,
    sharpness: 0
};

// Filter presets
export const FILTER_PRESETS: Record<string, Partial<FilterParams>> = {
    'vintage': { brightness: 0.1, contrast: 0.15, saturation: -0.2, temperature: 0.2, vignette: 0.3 },
    'bw': { saturation: -1, contrast: 0.2 },
    'vivid': { saturation: 0.4, contrast: 0.2, brightness: 0.05 },
    'cool': { temperature: -0.3, brightness: 0.05 },
    'warm': { temperature: 0.3, saturation: 0.1 },
    'dramatic': { contrast: 0.4, saturation: 0.1, vignette: 0.4 },
    'soft': { contrast: -0.2, brightness: 0.1, saturation: 0.1 },
    'hdr': { contrast: 0.3, saturation: 0.2, sharpness: 0.3 },
    'sepia': { saturation: -0.5, temperature: 0.4, brightness: 0.1 },
    'noir': { saturation: -1, contrast: 0.3, vignette: 0.5 },
    'fade': { contrast: -0.2, brightness: 0.15, saturation: -0.15 },
    'chrome': { contrast: 0.2, saturation: 0.3, brightness: 0.05 },
    'lofi': { saturation: 0.3, contrast: 0.25, vignette: 0.2 },
    'retro': { saturation: -0.1, temperature: 0.15, contrast: 0.1, vignette: 0.25 },
    'cinematic': { contrast: 0.15, saturation: -0.05, temperature: -0.1, vignette: 0.3 },
    'matte': { contrast: -0.15, brightness: 0.1, saturation: -0.1 },
    'sunset': { temperature: 0.4, saturation: 0.2, brightness: 0.1 },
    'aurora': { temperature: -0.2, saturation: 0.3, hue: 15 },
    'daylight': { temperature: 0.1, brightness: 0.1, contrast: 0.05 },
    'midnight': { brightness: -0.2, temperature: -0.2, contrast: 0.1, vignette: 0.4 }
};

/**
 * Apply filters to canvas via pixel manipulation
 */
export function applyFilters(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: Partial<FilterParams>,
    intensity: number = 1
): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Merge with defaults and apply intensity
    const p: FilterParams = {
        ...DEFAULT_FILTER_PARAMS,
        ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, (v as number) * intensity])
        ) as FilterParams
    };

    const brightnessMultiplier = 1 + p.brightness;
    const contrastFactor = (1 + p.contrast) ** 2; // Quadratic for more natural feel
    const saturationFactor = 1 + p.saturation;
    const exposureFactor = 2 ** p.exposure; // Photographic exposure

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Exposure
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;

        // Brightness
        r *= brightnessMultiplier;
        g *= brightnessMultiplier;
        b *= brightnessMultiplier;

        // Contrast
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

        // Saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + saturationFactor * (r - gray);
        g = gray + saturationFactor * (g - gray);
        b = gray + saturationFactor * (b - gray);

        // Temperature (shift R/B balance)
        if (p.temperature !== 0) {
            const tempShift = p.temperature * 30;
            r += tempShift;
            b -= tempShift;
        }

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    // Apply vignette
    if (p.vignette > 0) {
        applyVignette(data, width, height, p.vignette);
    }

    // Apply grain
    if (p.grain > 0) {
        applyGrain(data, p.grain);
    }

    ctx.putImageData(imageData, 0, 0);
}

function applyVignette(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const factor = 1 - (dist / maxDist) * amount;

            data[i] *= factor;
            data[i + 1] *= factor;
            data[i + 2] *= factor;
        }
    }
}

function applyGrain(data: Uint8ClampedArray, amount: number): void {
    const grainStrength = amount * 50;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * grainStrength;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
}

/**
 * Get filter preset by name with optional intensity
 */
export function getFilterPreset(name: string, intensity: number = 1): Partial<FilterParams> {
    const preset = FILTER_PRESETS[name] || {};
    return Object.fromEntries(
        Object.entries(preset).map(([k, v]) => [k, (v as number) * intensity])
    );
}
