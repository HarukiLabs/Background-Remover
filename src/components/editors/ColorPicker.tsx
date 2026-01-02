'use client';

import React from 'react';
import { SketchPicker } from 'react-color';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
    // We can add preset swatches easily here
    const presets = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
                {presets.map(c => (
                    <button
                        key={c}
                        onClick={() => onChange(c)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${color === c ? 'border-blue-500 scale-110' : 'border-white/10 hover:border-white/30'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
            </div>

            <div className="text-xs text-gray-500 text-center">Custom Color</div>

            <div className="flex justify-center [&_.sketch-picker]:!bg-[#2A2A2A] [&_.sketch-picker]:!text-white [&_.sketch-picker]:!shadow-none [&_.sketch-picker]:!border-0 [&_input]:!bg-[#333] [&_input]:!text-white [&_input]:!shadow-none">
                <SketchPicker
                    color={color}
                    onChange={(c) => onChange(c.hex)}
                    disableAlpha={true} // Fabric background color is mostly opaque for now, or we can enable it
                    presetColors={[]}
                    width="100%"
                />
            </div>
        </div>
    );
}
