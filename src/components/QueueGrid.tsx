'use client';

import React, { memo } from 'react';
import { useQueue } from '@/contexts/QueueContext';
import { QueueItemState } from '@/types/queue';
import { CheckSquare, Edit2 } from 'lucide-react';
import EffectsPanel from './editors/EffectsPanel';

const QueueItem = memo(({ item, onEdit }: { item: QueueItemState; onEdit?: () => void }) => {
    const { removeFile, selectedItems, toggleSelection } = useQueue();
    const isSelected = selectedItems.has(item.id);

    const statusColors: Record<string, string> = {
        queued: 'border-gray-600',
        processing: 'border-blue-500',
        completed: 'border-green-500',
        error: 'border-red-500',
    };

    return (
        <div
            className={`glass-card h-full rounded-xl overflow-hidden border-2 flex flex-col min-h-[280px] sm:h-[350px] transition-all duration-200 cursor-pointer ${isSelected
                ? 'border-blue-400 ring-2 ring-blue-500/50 scale-[1.02] bg-blue-500/10'
                : statusColors[item.status]
                }`}
            onClick={() => toggleSelection(item.id)}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-black/20 h-40 sm:h-48 group shrink-0">
                {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Preview</div>
                )}

                {/* Selection Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white bg-black/50'}`}>
                        {isSelected && <CheckSquare className="w-5 h-5" />}
                    </div>
                </div>

                {/* Edit & Status Badge */}
                <div className="absolute top-2 right-2 flex gap-2">
                    {/* Edit Button - Show if onEdit is provided */}
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="bg-black/70 hover:bg-black/90 text-white p-1.5 rounded transition-transform hover:scale-105 z-20"
                            title="Edit Image"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}

                    <div className={`px-2 py-1.5 rounded text-xs text-white capitalize ${item.status === 'completed' ? 'bg-green-600' : 'bg-black/70'}`}>
                        {item.status === 'completed' ? 'Finished' : item.status}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3 flex-grow flex flex-col gap-1">
                <h3 className="text-sm font-medium text-white truncate" title={item.name}>{item.name}</h3>
                <p className="text-xs text-gray-400">{(item.size / 1024 / 1024).toFixed(2)} MB</p>

                {item.progress > 0 && item.status === 'processing' && (
                    <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                    </div>
                )}

                {item.error && (
                    <p className="text-xs text-red-400 mt-1 truncate" title={item.error}>{item.error}</p>
                )}

                <div className="mt-auto pt-2 flex justify-between items-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFile(item.id);
                        }}
                        className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 z-10 transition-colors"
                    >
                        Remove
                    </button>
                    {isSelected && <span className="text-xs text-blue-400 font-medium">Selected</span>}
                </div>
            </div>
        </div>
    );
});

QueueItem.displayName = 'QueueItem';

export default function QueueGrid() {
    const { queue, saveEditedImage } = useQueue();
    const [editingItem, setEditingItem] = React.useState<QueueItemState | null>(null);

    const handleSaveEdit = async (blob: Blob) => {
        if (!editingItem) return;
        await saveEditedImage(editingItem.id, blob);
    };

    if (queue.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center text-gray-500">
                Queue is empty
            </div>
        );
    }

    const activeItems = queue.filter(item => item.status !== 'completed');
    const finishedItems = queue.filter(item => item.status === 'completed');

    return (
        <>
            <div className="w-full mt-8 pb-32 space-y-12">

                {/* Active Queue Section */}
                {activeItems.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white">
                            <h2 className="text-lg font-semibold">Active Queue</h2>
                            <span className="text-sm px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                {activeItems.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {activeItems.map(item => (
                                <QueueItem
                                    key={item.id}
                                    item={item}
                                    onEdit={item.status === 'queued' ? () => setEditingItem(item) : undefined}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Finished Section */}
                {finishedItems.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 text-white border-t border-white/10 pt-8">
                            <h2 className="text-lg font-semibold text-green-400">Finished</h2>
                            <span className="text-sm px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                {finishedItems.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {finishedItems.map(item => (
                                <QueueItem key={item.id} item={item} onEdit={() => setEditingItem(item)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {editingItem && editingItem.thumbnailUrl && (
                <EffectsPanel
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    imageUrl={editingItem.thumbnailUrl}
                    itemDetails={{ id: editingItem.id }}
                    onSave={handleSaveEdit}
                />
            )}
        </>
    );
}
