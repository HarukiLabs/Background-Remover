/**
 * RenderEngine - Unified canvas-based renderer
 * Single entry point for both preview and export
 * All effects applied via Canvas 2D API (NOT CSS)
 */

import { EditorState, EffectNode, Layer, BlurEffectParams, ShadowEffectParams, FilterEffectParams, BorderEffectParams, ColorEffectParams } from './EditorState';

export type RenderQuality = 'preview' | 'export';

export interface RenderOptions {
    quality: RenderQuality;
    format?: 'png' | 'jpeg' | 'webp';
    jpegQuality?: number; // 0-1
}

export class RenderEngine {
    private offscreenCanvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.offscreenCanvas = document.createElement('canvas');
        this.ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    /**
     * Main render function - single deterministic pass
     */
    public async render(
        state: EditorState,
        originalImage: ImageBitmap,
        alphaMask: ImageBitmap | null,
        options: RenderOptions
    ): Promise<Blob> {
        const { quality } = options;

        // Calculate render dimensions
        const scale = quality === 'preview'
            ? Math.min(1, state.previewQuality / Math.max(originalImage.width, originalImage.height))
            : 1;

        const width = Math.round(originalImage.width * scale);
        const height = Math.round(originalImage.height * scale);

        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
        this.ctx.clearRect(0, 0, width, height);

        // Render layers in order
        for (const layer of state.layers) {
            if (!layer.visible) continue;

            await this.renderLayer(layer, state, originalImage, alphaMask, width, height, scale);
        }

        // Apply effects to final canvas
        for (const effect of state.effects) {
            if (!effect.enabled) continue;
            this.applyEffect(effect, width, height);
        }

        // Export to blob
        return this.exportToBlob(options);
    }

    private async renderLayer(
        layer: Layer,
        state: EditorState,
        originalImage: ImageBitmap,
        alphaMask: ImageBitmap | null,
        width: number,
        height: number,
        scale: number
    ): Promise<void> {
        this.ctx.save();

        // Apply transform
        const t = layer.transform;
        this.ctx.translate(width * t.translateX, height * t.translateY);
        this.ctx.rotate(t.rotation * Math.PI / 180);
        this.ctx.scale(t.scaleX, t.scaleY);

        switch (layer.type) {
            case 'background':
                this.renderBackground(layer.params as ColorEffectParams, width, height);
                break;
            case 'border':
                this.renderBorder(layer.params as BorderEffectParams, width, height);
                break;
            case 'subject':
                await this.renderSubject(originalImage, alphaMask, width, height, scale);
                break;
            case 'sticker':
                // TODO: Implement sticker rendering
                break;
            case 'watermark':
                // TODO: Implement watermark rendering
                break;
        }

        this.ctx.restore();
    }

    private renderBackground(params: ColorEffectParams, width: number, height: number): void {
        if (params.gradient) {
            const g = params.gradient;
            let gradient: CanvasGradient;

            if (g.type === 'linear') {
                const angle = (g.angle || 0) * Math.PI / 180;
                const x1 = width / 2 - Math.cos(angle) * width;
                const y1 = height / 2 - Math.sin(angle) * height;
                const x2 = width / 2 + Math.cos(angle) * width;
                const y2 = height / 2 + Math.sin(angle) * height;
                gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            } else {
                gradient = this.ctx.createRadialGradient(
                    width / 2, height / 2, 0,
                    width / 2, height / 2, Math.max(width, height) / 2
                );
            }

            for (const stop of g.stops) {
                gradient.addColorStop(stop.position, stop.color);
            }

            this.ctx.fillStyle = gradient;
        } else {
            this.ctx.fillStyle = params.color;
        }

        this.ctx.globalAlpha = params.opacity ?? 1;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.globalAlpha = 1;
    }

    private renderBorder(params: BorderEffectParams, width: number, height: number): void {
        const thickness = params.thickness * Math.min(width, height);
        const radius = params.radius * Math.min(width, height);
        const padding = params.padding * Math.min(width, height);

        this.ctx.strokeStyle = params.color;
        this.ctx.lineWidth = thickness;

        const x = padding;
        const y = padding;
        const w = width - padding * 2;
        const h = height - padding * 2;

        // Rounded rect path
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.stroke();

        // Special templates
        if (params.template === 'polaroid') {
            // Extra space at bottom
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, height * 0.85, width, height * 0.15);
        }
    }

    private async renderSubject(
        originalImage: ImageBitmap,
        alphaMask: ImageBitmap | null,
        width: number,
        height: number,
        scale: number
    ): Promise<void> {
        if (!alphaMask) {
            // No mask, just draw original
            this.ctx.drawImage(originalImage, 0, 0, width, height);
            return;
        }

        // Create temp canvas for masked subject
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Draw original
        tempCtx.drawImage(originalImage, 0, 0, width, height);

        // Apply mask using destination-in
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(alphaMask, 0, 0, width, height);

        // Draw masked subject to main canvas
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    private applyEffect(effect: EffectNode, width: number, height: number): void {
        switch (effect.type) {
            case 'shadow':
                this.applyShadow(effect.params as ShadowEffectParams, width, height);
                break;
            case 'filter':
                this.applyFilter(effect.params as FilterEffectParams, width, height);
                break;
            case 'blur':
                this.applyBlur(effect.params as BlurEffectParams, width, height);
                break;
        }
    }

    private applyShadow(params: ShadowEffectParams, width: number, height: number): void {
        // Get current content
        const imageData = this.ctx.getImageData(0, 0, width, height);

        // Apply shadow
        this.ctx.shadowColor = params.color;
        this.ctx.shadowBlur = params.blur * Math.min(width, height);
        this.ctx.shadowOffsetX = params.offsetX * width;
        this.ctx.shadowOffsetY = params.offsetY * height;
        this.ctx.globalAlpha = params.opacity;

        // Redraw to apply shadow
        this.ctx.putImageData(imageData, 0, 0);
        this.ctx.globalAlpha = 1;
        this.ctx.shadowColor = 'transparent';
    }

    private applyFilter(params: FilterEffectParams, width: number, height: number): void {
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const brightness = 1 + params.brightness;
        const contrast = 1 + params.contrast;
        const saturation = 1 + params.saturation;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness
            r *= brightness;
            g *= brightness;
            b *= brightness;

            // Contrast
            r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
            g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
            b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

            // Saturation
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturation * (r - gray);
            g = gray + saturation * (g - gray);
            b = gray + saturation * (b - gray);

            // Clamp
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    private applyBlur(params: BlurEffectParams, width: number, height: number): void {
        const radius = Math.round(params.radius * Math.min(width, height));
        if (radius <= 0) return;

        // Use StackBlur for performance
        const StackBlur = require('stackblur-canvas');
        StackBlur.canvasRGBA(this.offscreenCanvas, 0, 0, width, height, radius);
    }

    private async exportToBlob(options: RenderOptions): Promise<Blob> {
        return new Promise((resolve) => {
            const format = options.format || 'png';
            const quality = options.jpegQuality || 0.92;

            this.offscreenCanvas.toBlob(
                (blob) => resolve(blob!),
                `image/${format}`,
                format === 'jpeg' ? quality : undefined
            );
        });
    }

    public dispose(): void {
        // Cleanup
        this.offscreenCanvas.width = 0;
        this.offscreenCanvas.height = 0;
    }
}

// Singleton instance
let renderEngineInstance: RenderEngine | null = null;

export const getRenderEngine = (): RenderEngine => {
    if (!renderEngineInstance) {
        renderEngineInstance = new RenderEngine();
    }
    return renderEngineInstance;
};
