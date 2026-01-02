'use client';

import { useQueue } from '@/contexts/QueueContext';
import { Play, Trash2, Download, PauseCircle, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import DownloadManager from './DownloadManager';

export default function BatchControls() {
    const { queue, isProcessing, processQueue, clearQueue, workerStats, selectedItems, selectAll, deselectAll } = useQueue();
    const [showDownloadManager, setShowDownloadManager] = useState(false);

    if (queue.length === 0) return null;

    const completedCount = queue.filter(i => i.status === 'completed').length;
    const isAllCompleted = completedCount === queue.length && queue.length > 0;

    const allSelected = queue.length > 0 && selectedItems.size === queue.length;
    const selectionLabel = selectedItems.size > 0 ? `(${selectedItems.size} selected)` : '';

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 p-4 z-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                    {/* Selection & Status */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6">
                        <button
                            onClick={allSelected ? deselectAll : selectAll}
                            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            {allSelected ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5" />}
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </button>

                        <div className="hidden md:block h-6 w-px bg-white/10" />

                        <div className="flex flex-col items-end md:items-start text-sm text-gray-300">
                            <span className="font-medium text-white">Queue: {queue.length} {selectionLabel}</span>
                            <span className="text-xs">Processing: {workerStats.activeWorkers} | Done: {completedCount}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <button
                            onClick={clearQueue}
                            disabled={isProcessing}
                            className="flex-1 md:flex-none px-4 py-3 md:py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </button>

                        {!isAllCompleted && (
                            <button
                                onClick={() => {
                                    if (selectedItems.size > 0) {
                                        processQueue(Array.from(selectedItems));
                                    } else {
                                        processQueue();
                                    }
                                }}
                                disabled={isProcessing}
                                className="flex-1 md:flex-none px-6 py-3 md:py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                            >
                                {isProcessing ? <PauseCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isProcessing ? 'Processing' : (selectedItems.size > 0 ? `Process (${selectedItems.size})` : 'Process All')}
                            </button>
                        )}

                        {(completedCount > 0) && (
                            <button
                                onClick={() => setShowDownloadManager(true)}
                                className="flex-1 md:flex-none px-6 py-3 md:py-2 rounded-lg text-sm bg-green-600 hover:bg-green-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" />
                                Download {selectionLabel || 'All'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DownloadManager
                isOpen={showDownloadManager}
                onClose={() => setShowDownloadManager(false)}
            />
        </>
    );
}
