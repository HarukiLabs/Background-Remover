'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { QueueItemState, QueueContextType } from '@/types/queue';
import { db } from '@/lib/db';
import { workerPool } from '@/lib/workerPool';
import { v4 as uuidv4 } from 'uuid';
import { fileToDataURL } from '@/lib/imageUtils';
import { ProcessingMode } from '@/lib/editor/EditorState';

const QueueContext = createContext<QueueContextType | null>(null);

type Action =
    | { type: 'ADD_ITEMS'; payload: QueueItemState[] }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<QueueItemState> } }
    | { type: 'CLEAR_QUEUE' };

function queueReducer(state: QueueItemState[], action: Action): QueueItemState[] {
    switch (action.type) {
        case 'ADD_ITEMS':
            return [...state, ...action.payload];
        case 'REMOVE_ITEM':
            return state.filter(item => item.id !== action.payload);
        case 'UPDATE_ITEM':
            return state.map(item =>
                item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
            );
        case 'CLEAR_QUEUE':
            return [];
        default:
            return state;
    }
}

export function QueueProvider({ children }: { children: React.ReactNode }) {
    const [queue, dispatch] = useReducer(queueReducer, []);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [globalProcessingMode, setGlobalMode] = React.useState<ProcessingMode>('remove-only');
    const [globalQuickSettings, setQuickSettings] = React.useState<Record<string, any>>({});

    // Stats calculation
    const workerStats = {
        activeWorkers: queue.filter(i => i.status === 'processing').length,
        completed: queue.filter(i => i.status === 'completed').length,
        total: queue.length
    };

    const addFiles = useCallback(async (files: File[]) => {
        const newItems: QueueItemState[] = [];

        for (const file of files) {
            const id = uuidv4();

            // Generate thumbnail (optimize: use worker or offscreen canvas later)
            const thumbnailDataUrl = await fileToDataURL(file); // For now full size, optimized later
            // Convert DataURL back to Blob for storage if needed, or just store file
            // Ideally generate small thumbnail

            const record = {
                id,
                originalBlob: file,
                name: file.name,
                type: file.type,
                size: file.size,
                createdAt: Date.now()
            };

            // Save to IDB
            await db.saveImage(record);

            newItems.push({
                id,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'queued',
                progress: 0,
                thumbnailUrl: thumbnailDataUrl,
                processingMode: globalProcessingMode,
                quickSettings: { ...globalQuickSettings }
            });
        }

        dispatch({ type: 'ADD_ITEMS', payload: newItems });
    }, []);

    const removeFile = useCallback(async (id: string) => {
        workerPool.cancelJob(id);
        await db.deleteImage(id);
        dispatch({ type: 'REMOVE_ITEM', payload: id });
    }, []);

    const clearQueue = useCallback(async () => {
        // Cancel all active processing jobs to stop workers
        queue.forEach(item => {
            if (item.status === 'processing') {
                workerPool.cancelJob(item.id);
            }
        });

        await db.clearAllImages();
        dispatch({ type: 'CLEAR_QUEUE' });
        setSelectedItems(new Set());
        setIsProcessing(false);
    }, [queue]); // Dependency on queue to access current items for cancellation

    const updateItemState = useCallback((id: string, updates: Partial<QueueItemState>) => {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, updates } });
    }, []);

    const processQueue = useCallback((itemIds?: string[]) => {
        setIsProcessing(true);

        // Filter items to process:
        // 1. Must be in 'queued' or 'error' status
        // 2. If itemIds provided, must be in that list
        const queuedItems = queue.filter(i =>
            (i.status === 'queued' || i.status === 'error') &&
            (!itemIds || itemIds.includes(i.id))
        );

        // If nothing to process, reset immediately
        if (queuedItems.length === 0) {
            // Only turn off if no other items are processing?
            // Conservative check: if we started 0 jobs, and nothing else is running, stop.
            if (workerPool.getActiveCount() === 0) {
                setIsProcessing(false);
            }
            return;
        }

        // Track remaining to process locally to decide when to turn off flag?
        // Actually, better to check global state inside completion, 
        // OR simply rely on a reactive effect?
        // A simple way: check if this was the last active item.

        queuedItems.forEach(item => {
            db.getImage(item.id).then(record => {
                if (!record) return;

                updateItemState(item.id, { status: 'processing', progress: 0, error: undefined });

                workerPool.addJob({
                    id: item.id,
                    file: record.originalBlob as File,
                    onStart: () => {
                        updateItemState(item.id, { status: 'processing', progress: 0 });
                    },
                    onProgress: (p) => {
                        updateItemState(item.id, { progress: p.percent });
                    },
                    onComplete: async (resultBlob) => {
                        await db.updateImage(item.id, { processedBlob: resultBlob });

                        // Create a URL for the result blob to show as preview
                        const resultUrl = URL.createObjectURL(resultBlob);

                        // Use functional update to check latest state
                        dispatch({
                            type: 'UPDATE_ITEM',
                            payload: {
                                id: item.id, updates: {
                                    status: 'completed',
                                    progress: 100,
                                    thumbnailUrl: resultUrl // Update thumbnail to show removed BG result
                                }
                            }
                        });

                        // Check if we are done processing
                        // We need to access the LATEST queue state. dispatch does not give us that easily here 
                        // unless we use a ref or check context. 
                        // But we can check if worker stats active is 0?
                        // WorkerPool knows best.

                        if (workerPool.getActiveCount() === 0 && workerPool.getQueueLength() === 0) {
                            setIsProcessing(false);
                        }
                    },
                    onError: (err) => {
                        dispatch({
                            type: 'UPDATE_ITEM',
                            payload: { id: item.id, updates: { status: 'error', error: err } }
                        });

                        if (workerPool.getActiveCount() === 0 && workerPool.getQueueLength() === 0) {
                            setIsProcessing(false);
                        }
                    }
                });
            });
        });
    }, [queue, updateItemState]);

    const cancelItem = useCallback((id: string) => {
        workerPool.cancelJob(id);
        updateItemState(id, { status: 'queued', progress: 0 }); // Reset to queued or cancelled state?
    }, [updateItemState]);

    // Selection Logic
    const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedItems(new Set(queue.map(item => item.id)));
    }, [queue]);

    const saveEditedImage = useCallback(async (id: string, newBlob: Blob) => {
        // Update DB
        await db.updateImage(id, { processedBlob: newBlob });

        // Create new thumbnail URL
        const newUrl = URL.createObjectURL(newBlob);

        // Update State
        dispatch({
            type: 'UPDATE_ITEM',
            payload: {
                id,
                updates: {
                    thumbnailUrl: newUrl,
                    status: 'completed',
                    progress: 100
                }
            }
        });
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const setGlobalProcessingMode = useCallback((mode: ProcessingMode, quickSettings?: Record<string, any>) => {
        setGlobalMode(mode);
        if (quickSettings) setQuickSettings(quickSettings);
    }, []);

    return (
        <QueueContext.Provider value={{
            queue,
            isProcessing,
            workerStats,
            addFiles,
            removeFile,
            processQueue,
            cancelItem,
            clearQueue,
            updateItemState,
            saveEditedImage,
            selectedItems,
            toggleSelection,
            selectAll,
            deselectAll,
            globalProcessingMode,
            setGlobalProcessingMode,
            globalQuickSettings
        }}>
            {children}
        </QueueContext.Provider>
    );
}

export function useQueue() {
    const context = useContext(QueueContext);
    if (!context) throw new Error('useQueue must be used within a QueueProvider');
    return context;
}
