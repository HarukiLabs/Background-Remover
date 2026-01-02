'use client';

import React from 'react';
import { Scissors, Palette, Sparkles, Moon, Square, Settings } from 'lucide-react';
import { ProcessingMode } from '@/lib/editor/EditorState';

interface ProcessingModeSelectorProps {
    selectedMode: ProcessingMode;
    onSelectMode: (mode: ProcessingMode) => void;
    compact?: boolean;
}

const MODES: { mode: ProcessingMode; icon: React.ReactNode; title: string; description: string; color: string }[] = [
    {
        mode: 'remove-only',
        icon: <Scissors className="w-6 h-6" />,
        title: 'Remove BG Only',
        description: 'Transparent PNG output',
        color: 'from-gray-500 to-gray-600'
    },
    {
        mode: 'remove-color',
        icon: <Palette className="w-6 h-6" />,
        title: 'Remove + Color',
        description: 'Add solid background',
        color: 'from-blue-500 to-blue-600'
    },
    {
        mode: 'remove-blur',
        icon: <Sparkles className="w-6 h-6" />,
        title: 'Remove + Blur',
        description: 'Blur original background',
        color: 'from-purple-500 to-purple-600'
    },
    {
        mode: 'remove-shadow',
        icon: <Moon className="w-6 h-6" />,
        title: 'Remove + Shadow',
        description: 'Add drop shadow',
        color: 'from-orange-500 to-orange-600'
    },
    {
        mode: 'remove-border',
        icon: <Square className="w-6 h-6" />,
        title: 'Remove + Border',
        description: 'Add frame/border',
        color: 'from-pink-500 to-pink-600'
    },
    {
        mode: 'custom',
        icon: <Settings className="w-6 h-6" />,
        title: 'Custom Mode',
        description: 'Full editor access',
        color: 'from-green-500 to-green-600'
    }
];

export default function ProcessingModeSelector({ selectedMode, onSelectMode, compact = false }: ProcessingModeSelectorProps) {
    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {MODES.map(({ mode, icon, title }) => (
                    <button
                        key={mode}
                        onClick={() => onSelectMode(mode)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === mode
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {icon}
                        <span className="hidden sm:inline">{title}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODES.map(({ mode, icon, title, description, color }) => (
                <button
                    key={mode}
                    onClick={() => onSelectMode(mode)}
                    className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${selectedMode === mode
                            ? `bg-gradient-to-br ${color} text-white shadow-lg scale-105`
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-102'
                        }`}
                >
                    {/* Selection indicator */}
                    {selectedMode === mode && (
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white animate-pulse" />
                    )}

                    <div className={`mb-3 p-2 rounded-lg inline-block ${selectedMode === mode ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                        }`}>
                        {icon}
                    </div>

                    <h3 className="font-semibold text-sm mb-1">{title}</h3>
                    <p className={`text-xs ${selectedMode === mode ? 'text-white/80' : 'text-gray-500'}`}>
                        {description}
                    </p>
                </button>
            ))}
        </div>
    );
}

// Quick Settings Popup for specific modes
interface QuickSettingsProps {
    mode: ProcessingMode;
    settings: Record<string, any>;
    onSettingsChange: (settings: Record<string, any>) => void;
}

export function QuickSettings({ mode, settings, onSettingsChange }: QuickSettingsProps) {
    switch (mode) {
        case 'remove-color':
            return (
                <div className="space-y-3">
                    <label className="text-sm text-gray-400">Background Color</label>
                    <div className="grid grid-cols-8 gap-2">
                        {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map(color => (
                            <button
                                key={color}
                                onClick={() => onSettingsChange({ ...settings, color })}
                                className={`w-8 h-8 rounded-lg border-2 transition-transform ${settings.color === color ? 'border-blue-500 scale-110' : 'border-white/10'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={settings.color || '#FFFFFF'}
                            onChange={(e) => onSettingsChange({ ...settings, color: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{settings.color || '#FFFFFF'}</span>
                    </div>
                </div>
            );

        case 'remove-blur':
            return (
                <div className="space-y-3">
                    <label className="text-sm text-gray-400">Blur Intensity</label>
                    <div className="flex gap-3">
                        {[
                            { label: 'Light', value: 0.015 },
                            { label: 'Medium', value: 0.03 },
                            { label: 'Heavy', value: 0.05 }
                        ].map(({ label, value }) => (
                            <button
                                key={label}
                                onClick={() => onSettingsChange({ ...settings, blurRadius: value })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${settings.blurRadius === value
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            );

        case 'remove-shadow':
            return (
                <div className="space-y-3">
                    <label className="text-sm text-gray-400">Shadow Strength</label>
                    <div className="flex gap-3">
                        {[
                            { label: 'Soft', value: { blur: 0.02, opacity: 0.2 } },
                            { label: 'Medium', value: { blur: 0.03, opacity: 0.4 } },
                            { label: 'Strong', value: { blur: 0.05, opacity: 0.6 } }
                        ].map(({ label, value }) => (
                            <button
                                key={label}
                                onClick={() => onSettingsChange({ ...settings, ...value })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${settings.opacity === value.opacity
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            );

        case 'remove-border':
            return (
                <div className="space-y-3">
                    <label className="text-sm text-gray-400">Border Style</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['solid', 'rounded', 'polaroid'].map(style => (
                            <button
                                key={style}
                                onClick={() => onSettingsChange({ ...settings, template: style })}
                                className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${settings.template === style
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
            );

        default:
            return null;
    }
}
