'use client';

import React, { useState } from 'react';
import { Type, Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TextOverlayProps {
    onAddText: (text: string, options: any) => void;
    activeObject: any; // Fabric object
    onUpdateText: (options: any) => void;
    onRemoveText: () => void;
}

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];

export default function TextOverlay({ onAddText, activeObject, onUpdateText, onRemoveText }: TextOverlayProps) {
    const [inputText, setInputText] = useState('New Text');

    // Check if selected object is text
    const isTextSelected = activeObject && activeObject.type === 'i-text';

    const handleAdd = () => {
        onAddText(inputText, {
            fontSize: 40,
            fill: '#000000',
            fontFamily: 'Arial'
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Text Overlay</h3>

            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="Enter text..."
                    />
                    <button
                        onClick={handleAdd}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                        title="Add Text Layer"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {isTextSelected ? (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                    <div className="p-4 bg-white/5 rounded-xl space-y-4 border border-white/10">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                            <span className="text-xs font-medium text-blue-400">Selected Text Settings</span>
                            <button
                                onClick={onRemoveText}
                                className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Font Family */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Font Family</label>
                            <select
                                value={activeObject.fontFamily}
                                onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
                                className="w-full bg-gray-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
                            >
                                {FONTS.map(font => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </select>
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={activeObject.fill as string}
                                    onChange={(e) => onUpdateText({ fill: e.target.value })}
                                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                                />
                                <span className="text-xs text-gray-500 font-mono">{activeObject.fill}</span>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Size ({Math.round(activeObject.fontSize)})</label>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={activeObject.fontSize}
                                onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Styles (Bold/Italic) */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => onUpdateText({ fontWeight: activeObject.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                className={`flex-1 py-1.5 rounded border border-white/10 text-xs font-bold ${activeObject.fontWeight === 'bold' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'text-gray-400'}`}
                            >
                                B
                            </button>
                            <button
                                onClick={() => onUpdateText({ fontStyle: activeObject.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                className={`flex-1 py-1.5 rounded border border-white/10 text-xs italic ${activeObject.fontStyle === 'italic' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'text-gray-400'}`}
                            >
                                I
                            </button>
                            <button
                                onClick={() => onUpdateText({ underline: !activeObject.underline })}
                                className={`flex-1 py-1.5 rounded border border-white/10 text-xs underline ${activeObject.underline ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'text-gray-400'}`}
                            >
                                U
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 border-2 border-dashed border-white/5 rounded-xl text-gray-500 text-sm">
                    Select text on canvas to edit
                </div>
            )}
        </div>
    );
}
