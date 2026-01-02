/**
 * AutoProcessor - Automatic processing pipeline based on selected mode
 * Chains: removeBg → generateMask → applyEffectChain
 */

import { v4 as uuidv4 } from 'uuid';
import {
    EditorState,
    ProcessingMode,
    MODE_EFFECT_CHAINS,
    createDefaultEditorState,
    EffectNode
} from './EditorState';
import { getRenderEngine } from './RenderEngine';
import { db } from '../db';

export interface ProcessOptions {
    mode: ProcessingMode;
    quickSettings?: Record<string, any>;
    imageId: string;
}

export interface ProcessResult {
    editorState: EditorState;
    previewBlob: Blob;
}

/**
 * Process an image with the selected mode
 * Returns an EditorState that can be rendered at any resolution
 */
export async function processWithMode(
    originalBlob: Blob,
    alphaMaskBlob: Blob | null,
    options: ProcessOptions
): Promise<ProcessResult> {
    const { mode, quickSettings, imageId } = options;

    // Create base editor state
    const editorState = createDefaultEditorState(uuidv4(), imageId);
    editorState.processingMode = mode;

    // Get the original image dimensions
    const imageBitmap = await createImageBitmap(originalBlob);
    editorState.canvasSize = { width: imageBitmap.width, height: imageBitmap.height };

    // If we have a mask, store the key
    if (alphaMaskBlob) {
        editorState.alphaMaskKey = `${imageId}_mask`;
    }

    // Get the effect chain for this mode
    const effectChain = MODE_EFFECT_CHAINS[mode] || [];

    // Apply quick settings overrides
    editorState.effects = effectChain.map((template, idx) => {
        const effect: EffectNode = {
            id: uuidv4(),
            type: template.type!,
            params: { ...template.params },
            enabled: true
        };

        // Apply quick settings
        if (quickSettings) {
            switch (effect.type) {
                case 'color':
                    if (quickSettings.color) effect.params.color = quickSettings.color;
                    break;
                case 'blur':
                    if (quickSettings.blurRadius) effect.params.radius = quickSettings.blurRadius;
                    break;
                case 'shadow':
                    if (quickSettings.blur) effect.params.blur = quickSettings.blur;
                    if (quickSettings.opacity) effect.params.opacity = quickSettings.opacity;
                    break;
                case 'border':
                    if (quickSettings.template) effect.params.template = quickSettings.template;
                    break;
            }
        }

        return effect;
    });

    // Update background layer based on mode
    if (mode === 'remove-color' && quickSettings?.color) {
        const bgLayer = editorState.layers.find(l => l.type === 'background');
        if (bgLayer) {
            bgLayer.params = { color: quickSettings.color, opacity: 1 };
        }
    }

    // Generate preview
    const renderEngine = getRenderEngine();
    const alphaBitmap = alphaMaskBlob ? await createImageBitmap(alphaMaskBlob) : null;

    const previewBlob = await renderEngine.render(
        editorState,
        imageBitmap,
        alphaBitmap,
        { quality: 'preview', format: 'png' }
    );

    return { editorState, previewBlob };
}

/**
 * Export at full resolution
 */
export async function exportWithState(
    editorState: EditorState,
    format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<Blob> {
    // Fetch original and mask from DB
    const record = await db.getImage(editorState.originalImageKey);
    if (!record) throw new Error('Original image not found');

    const originalBitmap = await createImageBitmap(record.originalBlob);
    const alphaBitmap = record.processedBlob
        ? await createImageBitmap(record.processedBlob)
        : null;

    const renderEngine = getRenderEngine();
    return renderEngine.render(
        editorState,
        originalBitmap,
        alphaBitmap,
        { quality: 'export', format }
    );
}

/**
 * Update a specific effect in the state
 */
export function updateEffect(
    state: EditorState,
    effectId: string,
    newParams: Record<string, any>
): EditorState {
    return {
        ...state,
        effects: state.effects.map(e =>
            e.id === effectId ? { ...e, params: { ...e.params, ...newParams } } : e
        )
    };
}

/**
 * Toggle an effect on/off
 */
export function toggleEffect(state: EditorState, effectId: string): EditorState {
    return {
        ...state,
        effects: state.effects.map(e =>
            e.id === effectId ? { ...e, enabled: !e.enabled } : e
        )
    };
}

/**
 * Add a new effect to the state
 */
export function addEffect(state: EditorState, type: EffectNode['type'], params: Record<string, any>): EditorState {
    const newEffect: EffectNode = {
        id: uuidv4(),
        type,
        params,
        enabled: true
    };

    return {
        ...state,
        effects: [...state.effects, newEffect]
    };
}

/**
 * Remove an effect from the state
 */
export function removeEffect(state: EditorState, effectId: string): EditorState {
    return {
        ...state,
        effects: state.effects.filter(e => e.id !== effectId)
    };
}
