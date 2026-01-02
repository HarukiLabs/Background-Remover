/**
 * EditorState - Non-destructive parametric state for the image editor
 * All values are resolution-agnostic (percentages or normalized values)
 */

// Transform matrix for layers (resolution-agnostic)
export interface TransformMatrix {
    scaleX: number;      // 1 = original size
    scaleY: number;
    rotation: number;    // degrees
    translateX: number;  // % of canvas width
    translateY: number;  // % of canvas height
}

export const DEFAULT_TRANSFORM: TransformMatrix = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    translateX: 0,
    translateY: 0
};

// Layer types in explicit order
export type LayerType = 'background' | 'border' | 'subject' | 'sticker' | 'watermark';

export interface Layer {
    id: string;
    type: LayerType;
    visible: boolean;
    locked: boolean;
    transform: TransformMatrix;
    params: Record<string, any>;
}

// Effect types
export type EffectType = 'color' | 'blur' | 'shadow' | 'filter' | 'border';

export interface EffectNode {
    id: string;
    type: EffectType;
    params: Record<string, any>;
    enabled: boolean;
}

// Specific effect params (all values % or normalized 0-1)
export interface ColorEffectParams {
    color: string;           // hex
    opacity: number;         // 0-1
    gradient?: {
        type: 'linear' | 'radial';
        stops: { position: number; color: string }[];
        angle?: number;      // degrees for linear
    };
}

export interface BlurEffectParams {
    radius: number;          // % of canvas dimension
    type: 'gaussian' | 'motion' | 'zoom';
    angle?: number;          // for motion blur
}

export interface ShadowEffectParams {
    offsetX: number;         // % of canvas
    offsetY: number;
    blur: number;            // % of canvas
    color: string;
    opacity: number;         // 0-1
}

export interface FilterEffectParams {
    preset?: string;         // 'vintage', 'bw', 'vivid', etc.
    brightness: number;      // -1 to 1
    contrast: number;        // -1 to 1
    saturation: number;      // -1 to 1
    temperature: number;     // -1 to 1 (cool to warm)
    intensity: number;       // 0-1 for preset blending
}

export interface BorderEffectParams {
    thickness: number;       // % of canvas
    radius: number;          // % of canvas
    padding: number;         // % of canvas
    color: string;
    style: 'solid' | 'dashed' | 'double';
    template?: 'none' | 'polaroid' | 'filmstrip' | 'rounded';
}

// Processing modes
export type ProcessingMode =
    | 'remove-only'
    | 'remove-color'
    | 'remove-blur'
    | 'remove-shadow'
    | 'remove-border'
    | 'custom';

// Main editor state
export interface EditorState {
    id: string;
    originalImageKey: string;    // IndexedDB key
    alphaMaskKey: string | null; // From BG removal
    canvasSize: { width: number; height: number };
    layers: Layer[];
    effects: EffectNode[];
    processingMode: ProcessingMode;
    previewQuality: number;      // Max dimension for preview (e.g., 800)
    exportQuality: number;       // Multiplier or 'full'
}

export const createDefaultEditorState = (id: string, imageKey: string): EditorState => ({
    id,
    originalImageKey: imageKey,
    alphaMaskKey: null,
    canvasSize: { width: 0, height: 0 },
    layers: [
        { id: 'bg', type: 'background', visible: true, locked: false, transform: DEFAULT_TRANSFORM, params: { color: '#ffffff' } },
        { id: 'border', type: 'border', visible: false, locked: false, transform: DEFAULT_TRANSFORM, params: {} },
        { id: 'subject', type: 'subject', visible: true, locked: false, transform: DEFAULT_TRANSFORM, params: {} },
    ],
    effects: [],
    processingMode: 'remove-only',
    previewQuality: 800,
    exportQuality: 1
});

// Preset effect chains for each mode
export const MODE_EFFECT_CHAINS: Record<ProcessingMode, Partial<EffectNode>[]> = {
    'remove-only': [],
    'remove-color': [{ type: 'color', params: { color: '#ffffff', opacity: 1 } }],
    'remove-blur': [{ type: 'blur', params: { radius: 0.03, type: 'gaussian' } }],
    'remove-shadow': [{ type: 'shadow', params: { offsetX: 0.02, offsetY: 0.02, blur: 0.02, color: '#000000', opacity: 0.4 } }],
    'remove-border': [{ type: 'border', params: { thickness: 0.02, radius: 0, padding: 0.02, color: '#000000', style: 'solid' } }],
    'custom': []
};
