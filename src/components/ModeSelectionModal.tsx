'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Scissors, Pipette, Sparkles, Plus, Trash2, Loader2, Eye, Download, Clock, History } from 'lucide-react';
import { processImage, ProcessingConfig, ProcessingMode } from '@/lib/imageProcessing';

export interface ModeConfig {
    mode: ProcessingMode;
    colorToRemove?: string;
    colorTolerance?: number;
    blurIntensity?: number;
}

interface ProcessedResult {
    id: string;
    originalName: string;
    blob: Blob;
    previewUrl: string;
}

interface HistoryItem {
    id: string;
    originalName: string;
    previewUrl: string;
    mode: ProcessingMode;
    timestamp: number;
    blob?: Blob;
}

interface ModeSelectionModalProps {
    files: File[];
    onComplete: () => void;
    onCancel: () => void;
    onAddMore: () => void;
    onRemoveFile: (index: number) => void;
}

const CHROMA_PRESETS = [
    { label: 'Green Screen', value: '#00FF00', emoji: '🟩' },
    { label: 'Blue Screen', value: '#0000FF', emoji: '🟦' },
    { label: 'White', value: '#FFFFFF', emoji: '⬜' },
    { label: 'Black', value: '#000000', emoji: '⬛' },
    { label: 'Red', value: '#FF0000', emoji: '🟥' },
    { label: 'Yellow', value: '#FFFF00', emoji: '🟨' },
];

export default function ModeSelectionModal({
    files,
    onComplete,
    onCancel,
    onAddMore,
    onRemoveFile
}: ModeSelectionModalProps) {
    // File previews
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

    // Mode & settings
    const [selectedMode, setSelectedMode] = useState<ProcessingMode | null>(null);
    const [colorToRemove, setColorToRemove] = useState('#00FF00');
    const [colorTolerance, setColorTolerance] = useState(30);
    const [blurIntensity, setBlurIntensity] = useState<10 | 25 | 50>(25);

    // Processing state
    const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

    // History
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Generate file previews on mount
    useEffect(() => {
        const previews = files.map(f => URL.createObjectURL(f));
        setFilePreviews(previews);
        return () => previews.forEach(p => URL.revokeObjectURL(p));
    }, [files]);

    // Load history from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('bg-remover-history');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setHistory(parsed.map((h: HistoryItem) => ({ ...h, blob: undefined })));
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        }
    }, []);

    // Auto-process when mode or settings change (debounced)
    useEffect(() => {
        if (!selectedMode || files.length === 0) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            processAllImages();
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [selectedMode, colorToRemove, colorTolerance, blurIntensity]);

    const processAllImages = async () => {
        if (!selectedMode) return;

        setIsProcessing(true);
        setProcessingProgress({ current: 0, total: files.length });

        // Revoke old preview URLs
        processedResults.forEach(r => URL.revokeObjectURL(r.previewUrl));
        setProcessedResults([]);

        const results: ProcessedResult[] = [];

        const config: ProcessingConfig = {
            mode: selectedMode,
            colorToRemove: selectedMode === 'remove-color' ? colorToRemove : undefined,
            colorTolerance: selectedMode === 'remove-color' ? colorTolerance : undefined,
            blurIntensity: selectedMode === 'blur-bg' ? blurIntensity : undefined,
        };

        console.log('🚀 Processing all images with config:', config);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setProcessingProgress({ current: i + 1, total: files.length });

            try {
                const blob = await processImage(file, config);
                const previewUrl = URL.createObjectURL(blob);

                results.push({
                    id: `${Date.now()}-${i}`,
                    originalName: file.name,
                    blob,
                    previewUrl,
                });
            } catch (error) {
                console.error('Failed to process', file.name, error);
            }
        }

        setProcessedResults(results);
        setIsProcessing(false);
        console.log('✅ All images processed:', results.length);
    };

    // Download a single result
    const downloadResult = (result: ProcessedResult) => {
        const a = document.createElement('a');
        a.href = result.previewUrl;
        a.download = result.originalName.replace(/\.\w+$/, '_processed.png');
        a.click();
    };

    // Download all results
    const downloadAll = () => {
        if (processedResults.length === 0) return;

        processedResults.forEach((result, idx) => {
            setTimeout(() => downloadResult(result), idx * 200);
        });

        // Save to history
        saveToHistory();
    };

    // Save to history
    const saveToHistory = () => {
        const newItems: HistoryItem[] = processedResults.map(r => ({
            id: r.id,
            originalName: r.originalName,
            previewUrl: r.previewUrl,
            mode: selectedMode!,
            timestamp: Date.now(),
            blob: r.blob,
        }));

        const updatedHistory = [...newItems, ...history].slice(0, 50); // Keep last 50
        setHistory(updatedHistory);

        // Save metadata to localStorage (without blobs)
        const metadata = updatedHistory.map(({ blob, ...rest }) => rest);
        localStorage.setItem('bg-remover-history', JSON.stringify(metadata));

        console.log('📋 Saved to history:', newItems.length, 'items');
    };

    // Clear history
    const clearHistory = () => {
        if (confirm('Clear all history? This cannot be undone.')) {
            history.forEach(h => h.previewUrl && URL.revokeObjectURL(h.previewUrl));
            setHistory([]);
            localStorage.removeItem('bg-remover-history');
        }
    };

    // Re-download from history
    const reDownload = (item: HistoryItem) => {
        if (item.blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(item.blob);
            a.download = item.originalName.replace(/\.\w+$/, '_processed.png');
            a.click();
        } else if (item.previewUrl) {
            const a = document.createElement('a');
            a.href = item.previewUrl;
            a.download = item.originalName.replace(/\.\w+$/, '_processed.png');
            a.click();
        }
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-6xl bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-4">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-[#1A1A1A]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-white">
                            📸 {files.length} Image{files.length > 1 ? 's' : ''}
                        </h2>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${showHistory ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            History ({history.length})
                        </button>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content */}
                {!showHistory ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

                        {/* Left: Thumbnails */}
                        <div className="p-4 border-r border-white/10 bg-black/20">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-400">Your Images</span>
                                <button onClick={onAddMore} className="text-xs text-blue-400 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {filePreviews.map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedPreviewIndex(idx)}
                                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${selectedPreviewIndex === idx ? 'border-blue-500' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={url} className="w-full h-full object-cover" />
                                        {selectedPreviewIndex === idx && (
                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center: Preview */}
                        <div className="p-4 flex flex-col">
                            <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                                👁️ Live Preview
                                {isProcessing && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {processingProgress.current}/{processingProgress.total}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex items-center justify-center min-h-[300px] rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
                                {!selectedMode && (
                                    <div className="text-center text-gray-500">
                                        <Pipette className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>Select a mode →</p>
                                    </div>
                                )}

                                {selectedMode && isProcessing && (
                                    <div className="text-center text-gray-400">
                                        <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin" />
                                        <p>Processing...</p>
                                    </div>
                                )}

                                {selectedMode && !isProcessing && processedResults[selectedPreviewIndex] && (
                                    <img
                                        src={processedResults[selectedPreviewIndex].previewUrl}
                                        className="max-w-full max-h-full object-contain"
                                        style={{
                                            background: selectedMode === 'remove-bg' || selectedMode === 'remove-color'
                                                ? 'repeating-conic-gradient(#404040 0% 25%, #606060 0% 50%) 50% / 16px 16px'
                                                : 'transparent'
                                        }}
                                    />
                                )}
                            </div>

                            {processedResults.length > 0 && !isProcessing && (
                                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                    <p className="text-green-400 text-sm">✅ {processedResults.length} images ready!</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Mode Selection */}
                        <div className="p-4 border-l border-white/10 space-y-3">
                            <span className="text-sm text-gray-400">🎯 Select Mode</span>

                            {/* Mode 1: Remove BG */}
                            <div
                                onClick={() => setSelectedMode('remove-bg')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMode === 'remove-bg' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Scissors className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-white text-sm">Remove Background (AI)</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Intelligent background removal</p>
                            </div>

                            {/* Mode 2: Remove Color */}
                            <div
                                onClick={() => setSelectedMode('remove-color')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMode === 'remove-color' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Pipette className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-white text-sm">Remove Color (Chroma Key)</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Remove specific color (green screen)</p>

                                {selectedMode === 'remove-color' && (
                                    <div className="mt-3 pt-3 border-t border-white/10 space-y-3" onClick={e => e.stopPropagation()}>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Color to remove:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {CHROMA_PRESETS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => setColorToRemove(c.value)}
                                                        className={`w-8 h-8 rounded-lg text-sm border-2 ${colorToRemove === c.value ? 'border-purple-400 scale-110' : 'border-white/20'
                                                            }`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.label}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={colorToRemove}
                                                    onChange={e => setColorToRemove(e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Tolerance: {colorTolerance}</p>
                                            <input
                                                type="range"
                                                min="5"
                                                max="100"
                                                value={colorTolerance}
                                                onChange={e => setColorTolerance(Number(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none bg-white/20"
                                            />
                                            <p className="text-xs text-gray-500">Higher = remove similar shades</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mode 3: Blur BG */}
                            <div
                                onClick={() => setSelectedMode('blur-bg')}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMode === 'blur-bg' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-white text-sm">Blur Background</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Keep subject sharp, blur BG</p>

                                {selectedMode === 'blur-bg' && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex gap-2" onClick={e => e.stopPropagation()}>
                                        {[10, 25, 50].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setBlurIntensity(v as 10 | 25 | 50)}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${blurIntensity === v ? 'bg-cyan-600 text-white' : 'bg-white/10 text-gray-400'
                                                    }`}
                                            >
                                                {v === 10 ? 'Light' : v === 25 ? 'Medium' : 'Heavy'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* History Panel */
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-medium">📋 Processing History</h3>
                            {history.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No history yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {history.map(item => (
                                    <div key={item.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                        <div className="aspect-square bg-black/30 flex items-center justify-center">
                                            {item.previewUrl ? (
                                                <img src={item.previewUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-500 text-xs">No preview</span>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs text-white truncate">{item.originalName}</p>
                                            <p className="text-xs text-gray-500">{formatTime(item.timestamp)}</p>
                                            <button
                                                onClick={() => reDownload(item)}
                                                className="mt-1 w-full py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                                            >
                                                📥 Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!showHistory && (
                    <div className="sticky bottom-0 p-4 border-t border-white/10 bg-[#1A1A1A] flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 text-gray-400 bg-white/5 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={downloadAll}
                            disabled={processedResults.length === 0 || isProcessing}
                            className={`flex-[2] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${processedResults.length > 0 && !isProcessing
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Download className="w-5 h-5" />
                            Download All ({processedResults.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
