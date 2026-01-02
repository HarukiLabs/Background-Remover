'use client';

import React from 'react';

interface BackgroundBlurProps {
    blurAmount: number;
    onChange: (amount: number) => void;
    onToggleOriginal: (enabled: boolean) => void;
    isOriginalEnabled: boolean;
}

export default function BackgroundBlur({ blurAmount, onChange, onToggleOriginal, isOriginalEnabled }: BackgroundBlurProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Background Blur</h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-sm text-gray-300">Use Original Image</span>
                    <input
                        type="checkbox"
                        checked={isOriginalEnabled}
                        onChange={(e) => onToggleOriginal(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                </div>

                {isOriginalEnabled && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Blur Intensity</span>
                            <span>{blurAmount}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={blurAmount}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This will use your original uploaded image as the background and apply a blur effect.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
