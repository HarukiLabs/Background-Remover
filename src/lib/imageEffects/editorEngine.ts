import { fabric } from 'fabric';

export interface EditorState {
    backgroundColor: string;
    shadow: {
        color: string;
        blur: number;
        offsetX: number;
        offsetY: number;
        opacity: number;
        enabled: boolean;
    };
    // Add more state as needed
}

export class EditorEngine {
    private canvas: fabric.Canvas;
    private subjectImage: fabric.Image | null = null;
    private originalWidth: number = 0;
    private originalHeight: number = 0;

    private isDisposed: boolean = false;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            preserveObjectStacking: true,
            selection: false, // Disable group selection for now
            controlsAboveOverlay: true,
            centeredScaling: true,
        });
    }

    public async loadImage(imageUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(imageUrl, (img) => {
                if (this.isDisposed) return; // Guard against disposal

                if (!img) {
                    reject(new Error('Failed to load image'));
                    return;
                }

                this.canvas.clear();
                this.subjectImage = img;

                // Store original dimensions
                this.originalWidth = img.width || 800;
                this.originalHeight = img.height || 600;

                // Set canvas size to match image (or scaled down for preview)
                // For now, let's keep 1:1 for simplicity, or fit to window?
                // Better: Fit to a max dimension for performance, scale up on export.

                // For now, simple 1:1
                this.canvas.setWidth(this.originalWidth);
                this.canvas.setHeight(this.originalHeight);

                img.set({
                    selectable: true,
                    evented: true,
                    lockScalingFlip: true,
                });

                // Center the image
                this.canvas.centerObject(img);
                this.canvas.add(img);
                this.canvas.setActiveObject(img);
                this.canvas.renderAll();
                resolve();
            }, { crossOrigin: 'anonymous' });
        });
    }

    public setBackgroundColor(color: string) {
        this.canvas.backgroundColor = color;
        this.canvas.renderAll();
    }

    public updateShadow(shadowConfig: EditorState['shadow']) {
        if (!this.subjectImage) return;

        if (!shadowConfig.enabled) {
            this.subjectImage.set('shadow', undefined);
        } else {
            // Hex color to RGBA for opacity
            // Simple hex to rgba helper needed or assume color is hex
            const shadow = new fabric.Shadow({
                color: shadowConfig.color, // Ideally parse opacity into this color string
                blur: shadowConfig.blur,
                offsetX: shadowConfig.offsetX,
                offsetY: shadowConfig.offsetY,
            });
            this.subjectImage.set('shadow', shadow);
        }
        this.canvas.renderAll();
    }

    public async exportCanvas(): Promise<Blob> {
        // Render all
        this.canvas.renderAll();

        // Export to Blob
        return new Promise((resolve) => {
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1, // Export at 1x scale (original resolution)
            });

            // Convert DataURL to Blob
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => resolve(blob));
        });
    }

    public resizeCanvas(width: number, height: number) {
        this.canvas.setWidth(width);
        this.canvas.setHeight(height);
        this.canvas.renderAll();
    }

    public addText(text: string, options: any = {}) {
        const iText = new fabric.IText(text, {
            left: this.canvas.width! / 2,
            top: this.canvas.height! / 2,
            originX: 'center',
            originY: 'center',
            fontFamily: options.fontFamily || 'Arial',
            fontSize: options.fontSize || 40,
            fill: options.fill || '#000000',
            ...options
        });

        this.canvas.add(iText);
        this.canvas.setActiveObject(iText);
        this.canvas.renderAll();
    }

    public updateActiveObject(updates: any) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.set(updates);
            this.canvas.requestRenderAll();
        }
    }

    public removeActiveObject() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject !== this.subjectImage) {
            this.canvas.remove(activeObject);
            this.canvas.discardActiveObject();
            this.canvas.requestRenderAll();
        }
    }

    public getActiveObject(): fabric.Object | null {
        return this.canvas.getActiveObject();
    }

    // Subscribe to selection events to update UI
    public onSelectionChange(callback: (obj: fabric.Object | null) => void) {
        this.canvas.on('selection:created', (e) => callback(e.selected ? e.selected[0] : null));
        this.canvas.on('selection:updated', (e) => callback(e.selected ? e.selected[0] : null));
        this.canvas.on('selection:cleared', () => callback(null));
    }

    // Background Blur methods
    public async setOriginalBackground(originalUrl: string, blurAmount: number) {
        if (!originalUrl) return;

        // 1. Load original image into an HTML Image element (offscreen)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = originalUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // 2. Create offscreen canvas for blurring
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.originalWidth || img.width;
        offCanvas.height = this.originalHeight || img.height;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        // Draw image fit to canvas
        ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

        // 3. Apply Blur using StackBlur
        const StackBlur = require('stackblur-canvas');
        if (blurAmount > 0) {
            StackBlur.canvasRGBA(offCanvas, 0, 0, offCanvas.width, offCanvas.height, blurAmount);
        }

        // 4. Create Fabric Image from blurred canvas
        const bgInstance = new fabric.Image(offCanvas, {
            originX: 'left',
            originY: 'top',
            scaleX: 1,
            scaleY: 1,
            selectable: false,
            evented: false
        });

        // 5. Set as specific background object, not background color
        this.canvas.setBackgroundImage(bgInstance, this.canvas.renderAll.bind(this.canvas), {
            // Options to fit? already formatted to size
        });
    }

    public removeBackgroundImage() {
        this.canvas.setBackgroundImage(null as any, this.canvas.renderAll.bind(this.canvas));
        this.canvas.backgroundColor = '#ffffff';
    }

    public dispose() {
        this.isDisposed = true;
        this.canvas.dispose();
    }
}
