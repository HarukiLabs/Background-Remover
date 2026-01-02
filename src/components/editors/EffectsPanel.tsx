'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorEngine, EditorState } from '@/lib/imageEffects/editorEngine';
import { X, Save, Palette, Droplet, Type, Sparkles } from 'lucide-react';
import ColorPicker from '@/components/editors/ColorPicker';
import TextOverlay from './TextOverlay';
import BackgroundBlur from './BackgroundBlur';
import { db } from '@/lib/db';

interface EffectsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    itemDetails: { id: string; originalWidth?: number; originalHeight?: number };
    onSave: (blob: Blob) => Promise<void>;
}

type Tab = 'background' | 'shadow' | 'text' | 'blur' | 'filters';

export default function EffectsPanel({ isOpen, onClose, imageUrl, itemDetails, onSave }: EffectsPanelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<EditorEngine | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('background');
    const [isSaving, setIsSaving] = useState(false);
    const [activeObject, setActiveObject] = useState<any>(null);

    // Blur State
    const [blurState, setBlurState] = useState({ enabled: false, amount: 20 });
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);

    // Editor State
    const [state, setState] = useState<EditorState>({
        backgroundColor: '#ffffff',
        shadow: {
            enabled: false,
            color: '#000000',
            blur: 10,
            opacity: 0.5,
            offsetX: 5,
            offsetY: 5
        }
    });

    // Fetch Original Image on Mount
    useEffect(() => {
        if (isOpen && itemDetails?.id) {
            db.getImage(itemDetails.id).then(record => {
                if (record && record.originalBlob) {
                    setOriginalUrl(URL.createObjectURL(record.originalBlob));
                }
            });
        }
    }, [isOpen, itemDetails]);

    // Initialize Engine
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const engine = new EditorEngine(canvasRef.current);
        engineRef.current = engine;

        // Listen to selection
        engine.onSelectionChange((obj) => {
            setActiveObject(obj ? obj.toObject(['id', 'type', 'fontFamily', 'fontSize', 'fill', 'fontWeight', 'fontStyle', 'underline']) : null);
        });

        // Load Image
        engine.loadImage(imageUrl).catch(err => {
            console.error("Failed to load image into editor", err);
        });

        return () => {
            engine.dispose();
            engineRef.current = null;
        };
    }, [isOpen, imageUrl]);

    // Update Background
    useEffect(() => {
        if (!engineRef.current) return;
        // Logic: If blur enabled, use that. Else use background color.
        if (blurState.enabled && originalUrl) {
            // managed by next effect
        } else {
            engineRef.current.setBackgroundColor(state.backgroundColor);
        }
    }, [state.backgroundColor, blurState.enabled, originalUrl]);

    // Update Shadow
    useEffect(() => {
        if (!engineRef.current) return;
        engineRef.current.updateShadow(state.shadow);
    }, [state.shadow]);

    // Update Blur
    useEffect(() => {
        if (!engineRef.current) return;

        if (blurState.enabled && originalUrl) {
            engineRef.current.setOriginalBackground(originalUrl, blurState.amount);
        } else {
            engineRef.current.removeBackgroundImage();
            engineRef.current.setBackgroundColor(state.backgroundColor);
        }
    }, [blurState, originalUrl, state.backgroundColor]);


    const handleSave = async () => {
        if (!engineRef.current) return;
        setIsSaving(true);
        try {
            const blob = await engineRef.current.exportCanvas();
            await onSave(blob);
            onClose();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save image");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#1A1A1A]">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-semibold text-white">Editor</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 bg-[#121212] flex items-center justify-center p-8 overflow-auto">
                    <div className="shadow-2xl border border-white/5">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                {/* Right Panel - Controls */}
                <div className="w-80 bg-[#1A1A1A] border-l border-white/10 flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('background')}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'background' ? 'text-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Palette className="w-5 h-5" />
                            Background
                        </button>
                        <button
                            onClick={() => setActiveTab('shadow')}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'shadow' ? 'text-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Droplet className="w-5 h-5" />
                            Shadow
                        </button>
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'text' ? 'text-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Type className="w-5 h-5" />
                            Text
                        </button>
                        <button
                            onClick={() => setActiveTab('blur')}
                            className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'blur' ? 'text-blue-400 bg-white/5' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Sparkles className="w-5 h-5" />
                            Blur
                        </button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'background' && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Background</h3>
                                <ColorPicker
                                    color={state.backgroundColor}
                                    onChange={(c: string) => setState(prev => ({ ...prev, backgroundColor: c }))}
                                />
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <TextOverlay
                                onAddText={(text, opts) => engineRef.current?.addText(text, opts)}
                                activeObject={activeObject}
                                onUpdateText={(updates) => {
                                    engineRef.current?.updateActiveObject(updates);
                                    setActiveObject((prev: any) => ({ ...prev, ...updates }));
                                }}
                                onRemoveText={() => engineRef.current?.removeActiveObject()}
                            />
                        )}

                        {activeTab === 'blur' && (
                            <BackgroundBlur
                                blurAmount={blurState.amount}
                                isOriginalEnabled={blurState.enabled}
                                onChange={(amount) => setBlurState(prev => ({ ...prev, amount }))}
                                onToggleOriginal={(enabled) => setBlurState(prev => ({ ...prev, enabled }))}
                            />
                        )}

                        {activeTab === 'shadow' && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Drop Shadow</h3>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Enable Shadow</span>
                                    <input
                                        type="checkbox"
                                        checked={state.shadow.enabled}
                                        onChange={(e) => setState(prev => ({
                                            ...prev,
                                            shadow: { ...prev.shadow, enabled: e.target.checked }
                                        }))}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600"
                                    />
                                </div>

                                {state.shadow.enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400">Blur ({state.shadow.blur}px)</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={state.shadow.blur}
                                                onChange={(e) => setState(prev => ({
                                                    ...prev,
                                                    shadow: { ...prev.shadow, blur: Number(e.target.value) }
                                                }))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400">Horizontal Offset ({state.shadow.offsetX}px)</label>
                                            <input
                                                type="range"
                                                min="-50"
                                                max="50"
                                                value={state.shadow.offsetX}
                                                onChange={(e) => setState(prev => ({
                                                    ...prev,
                                                    shadow: { ...prev.shadow, offsetX: Number(e.target.value) }
                                                }))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400">Vertical Offset ({state.shadow.offsetY}px)</label>
                                            <input
                                                type="range"
                                                min="-50"
                                                max="50"
                                                value={state.shadow.offsetY}
                                                onChange={(e) => setState(prev => ({
                                                    ...prev,
                                                    shadow: { ...prev.shadow, offsetY: Number(e.target.value) }
                                                }))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400">Shadow Color</label>
                                            <input
                                                type="color"
                                                value={state.shadow.color}
                                                onChange={(e) => setState(prev => ({
                                                    ...prev,
                                                    shadow: { ...prev.shadow, color: e.target.value }
                                                }))}
                                                className="w-full h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
