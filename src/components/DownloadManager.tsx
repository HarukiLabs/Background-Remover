'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/contexts/QueueContext';
import { db } from '@/lib/db';
import { convertFormat, generateFilename } from '@/lib/formatConverter';
import { downloadBlob } from '@/lib/imageUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { X, Download, FileArchive, Layers, Check, AlertCircle, PauseCircle, PlayCircle, FolderDown } from 'lucide-react';
import { QueueItemState } from '@/types/queue';

interface DownloadOptions {
    mode: 'zip' | 'individual';
    formats: ('png' | 'jpg' | 'jpeg')[];
    backgroundColor: string;
    selectedImages: string[]; // image IDs
}

interface DownloadManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DownloadManager({ isOpen, onClose }: DownloadManagerProps) {
    const { queue, selectedItems } = useQueue();

    // Initial processed images (completed only)
    // Logic: if items are selected, only download those (if completed). If no selection, downoad all completed.
    const getDownloadableItems = () => {
        const candidates = selectedItems.size > 0
            ? queue.filter(item => selectedItems.has(item.id))
            : queue;
        return candidates.filter(item => item.status === 'completed');
    };

    const [downloadableItems, setDownloadableItems] = useState<QueueItemState[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDownloadableItems(getDownloadableItems());
        }
    }, [isOpen, queue, selectedItems]);

    const [options, setOptions] = useState<DownloadOptions>({
        mode: 'zip',
        formats: ['png'],
        backgroundColor: '#FFFFFF',
        selectedImages: []
    });

    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [statusMessage, setStatusMessage] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    // Refs for tracking mutable state inside async loops
    const isDownloadingRef = React.useRef(false);
    const isPausedRef = React.useRef(false);

    // Sync refs with state
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    const toggleFormat = (format: 'png' | 'jpg' | 'jpeg') => {
        setOptions(prev => {
            const newFormats = prev.formats.includes(format)
                ? prev.formats.filter(f => f !== format)
                : [...prev.formats, format];
            return { ...prev, formats: newFormats };
        });
    };

    const handleStartDownload = async () => {
        if (options.formats.length === 0) {
            alert("Please select at least one format.");
            return;
        }

        setIsDownloading(true);
        isDownloadingRef.current = true;

        setProgress(0);
        setLogs([]);
        setIsPaused(false);
        isPausedRef.current = false;

        try {
            if (options.mode === 'zip') {
                await downloadAsZip();
            } else {
                await downloadIndividually();
            }
        } catch (error: any) {
            console.error("Download failed", error);
            setStatusMessage(`Error: ${error.message}`);
            setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
        } finally {
            setIsDownloading(false);
            isDownloadingRef.current = false;
        }
    };

    const downloadAsZip = async () => {
        setStatusMessage("Preparing ZIP file...");
        const zip = new JSZip();

        const totalOps = downloadableItems.length * options.formats.length;
        let completedOps = 0;

        for (const item of downloadableItems) {
            if (!isDownloadingRef.current) break;

            const record = await db.getImage(item.id);
            if (!record || !record.processedBlob) {
                setLogs(prev => [...prev, `⚠️ Skipped ${item.name} (not found)`]);
                continue;
            }

            setLogs(prev => [...prev, `Processing ${item.name}...`]);

            for (const format of options.formats) {
                try {
                    let blob = record.processedBlob;

                    // Convert if needed (processedBlob is usually PNG)
                    if (format !== 'png') {
                        blob = await convertFormat(blob, format, options.backgroundColor);
                    }

                    const filename = generateFilename(item.name, format);
                    zip.file(filename, blob);

                    completedOps++;
                    const currentPercent = (completedOps / totalOps) * 80;
                    // Only update state if meaningful change to avoid render thrashing
                    setProgress(prev => Math.abs(prev - currentPercent) > 1 ? currentPercent : prev);

                } catch (err) {
                    console.error(`Failed to process ${item.name} as ${format}`, err);
                    setLogs(prev => [...prev, `❌ Failed ${item.name} (${format})`]);
                }
            }
        }

        if (!isDownloadingRef.current) return;

        setStatusMessage("Compressing ZIP...");
        const zipContent = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 5 }
        }, (metadata) => {
            // Use ref check inside callback if possible, but callback is sync-ish often
            setProgress(80 + (metadata.percent * 0.2));
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        saveAs(zipContent, `removed_backgrounds_${timestamp}.zip`);

        setStatusMessage("Download Started!");
        setLogs(prev => [...prev, `✅ ZIP Download ready`]);
        setProgress(100);
    };

    const downloadIndividually = async () => {
        const totalOps = downloadableItems.length * options.formats.length;
        let completedOps = 0;

        for (const item of downloadableItems) {
            // Check pause loop
            while (isPausedRef.current) {
                if (!isDownloadingRef.current) break; // Allow cancel while paused
                await new Promise(r => setTimeout(r, 500));
            }

            if (!isDownloadingRef.current) break;

            const record = await db.getImage(item.id);
            if (!record || !record.processedBlob) {
                continue;
            }

            setStatusMessage(`Downloading ${item.name}...`);
            // This log causes render, verify it doesn't break loop flow
            setLogs(prev => [...prev, `Downloading ${item.name}...`]);

            for (const format of options.formats) {
                if (!isDownloadingRef.current) break;

                try {
                    let blob = record.processedBlob;
                    if (format !== 'png') {
                        blob = await convertFormat(blob, format, options.backgroundColor);
                    }

                    const filename = generateFilename(item.name, format);

                    // Trigger download
                    saveAs(blob, filename);

                    // Delay to prevent browser blocking (critical for individual downloads)
                    await new Promise(resolve => setTimeout(resolve, 800));

                    completedOps++;
                    setProgress((completedOps / totalOps) * 100);

                } catch (err) {
                    setLogs(prev => [...prev, `❌ Failed ${item.name} (${format})`]);
                }
            }
        }

        if (isDownloadingRef.current) {
            setStatusMessage("All downloads completed");
            setLogs(prev => [...prev, `✅ All Batch downloads done`]);
        } else {
            setStatusMessage("Download cancelled");
            setLogs(prev => [...prev, `⚠️ Cancelled`]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1A1A1A] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Download Options</h2>
                            <p className="text-sm text-gray-400">{downloadableItems.length} images ready to download</p>
                        </div>
                    </div>
                    {!isDownloading && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-8">

                    {/* 1. Mode Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Download Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setOptions({ ...options, mode: 'zip' })}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${options.mode === 'zip'
                                    ? 'border-blue-500 bg-blue-500/10 text-white'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                disabled={isDownloading}
                            >
                                <FileArchive className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="font-medium">Download as ZIP</div>
                                    <div className="text-xs opacity-70">All files in one archive</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setOptions({ ...options, mode: 'individual' })}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${options.mode === 'individual'
                                    ? 'border-blue-500 bg-blue-500/10 text-white'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                disabled={isDownloading}
                            >
                                <Layers className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="font-medium">Individual Files</div>
                                    <div className="text-xs opacity-70">Sequential download</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 2. Format Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Formats</label>
                        <div className="flex flex-wrap gap-3">
                            {['png', 'jpg', 'jpeg'].map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => toggleFormat(fmt as any)}
                                    disabled={isDownloading}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${options.formats.includes(fmt as any)
                                        ? 'border-blue-500 bg-blue-500 text-white'
                                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                                        }`}
                                >
                                    {options.formats.includes(fmt as any) && <Check className="w-3 h-3" />}
                                    <span className="uppercase">{fmt}</span>
                                </button>
                            ))}
                        </div>

                        {/* Background Color Picker for JPG */}
                        {(options.formats.includes('jpg') || options.formats.includes('jpeg')) && (
                            <div className="mt-4 p-4 rounded-xl bg-gray-800/50 border border-white/5">
                                <label className="text-sm text-gray-400 mb-2 block">Background Color (for JPG/JPEG)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={options.backgroundColor}
                                        onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                                        disabled={isDownloading}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                    />
                                    <span className="text-white font-mono">{options.backgroundColor}</span>

                                    <div className="flex gap-2 ml-4">
                                        {['#FFFFFF', '#000000', '#808080'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setOptions({ ...options, backgroundColor: color })}
                                                className="w-8 h-8 rounded-full border border-white/20"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress & Logs */}
                    {isDownloading && (
                        <div className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-3">
                            <div className="flex justify-between text-sm text-gray-300">
                                <span>{statusMessage}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Log Terminal */}
                            <div className="h-32 overflow-y-auto font-mono text-xs text-gray-400 bg-black/50 p-2 rounded border border-white/5 space-y-1 custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                    {isDownloading ? (
                        <div className="flex gap-3">
                            {/* Pause/Resume for Individual Mode mostly */}
                            {options.mode === 'individual' && (
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white transition-all"
                                >
                                    {isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                                    {isPaused ? "Resume" : "Pause"}
                                </button>
                            )}
                            <div className="text-sm text-gray-500 self-center animate-pulse">
                                Do not close this window...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-sm text-gray-500">
                                {downloadableItems.length === 0 ? "No completed items to download" : "Ready to process"}
                            </div>
                            <button
                                onClick={handleStartDownload}
                                disabled={downloadableItems.length === 0}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                            >
                                <FolderDown className="w-5 h-5" />
                                Start Download
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
