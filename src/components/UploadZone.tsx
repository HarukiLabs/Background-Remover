'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle } from 'lucide-react';
import { validateImageFile } from '@/lib/imageUtils';

interface UploadZoneProps {
    onFileSelect: (files: File[]) => void;
    isProcessing: boolean;
    disabled?: boolean;
}

export default function UploadZone({ onFileSelect, isProcessing, disabled = false }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                const validFiles: File[] = [];
                let hasError = false;

                for (const file of files) {
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                        setError(validation.error || `Invalid file: ${file.name}`);
                        hasError = true;
                        // We could continue to process valid ones, but showing error is safer for now
                        // Or we can just collect valid ones and warn about invalid
                    } else {
                        validFiles.push(file);
                    }
                }

                if (validFiles.length > 0) {
                    if (!hasError) setError(null);
                    onFileSelect(validFiles);
                }
            }
        },
        [onFileSelect, disabled]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                const validFiles: File[] = [];

                for (const file of files) {
                    const validation = validateImageFile(file);
                    if (validation.valid) {
                        validFiles.push(file);
                    } else {
                        setError(validation.error || `Invalid file: ${file.name}`);
                    }
                }

                if (validFiles.length > 0) {
                    setError(null);
                    onFileSelect(validFiles);
                }
            }
            // Reset input so same files can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
          relative group cursor-pointer
          border-2 border-dashed rounded-2xl p-8 md:p-12
          transition-all duration-300 ease-in-out gpu-accelerated
          flex flex-col items-center justify-center text-center
          active:scale-[0.98]
          ${isDragging
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                        : disabled
                            ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                            : 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                />

                <div className={`
          p-4 rounded-full mb-4 transition-transform duration-300
          ${isDragging ? 'bg-blue-500 text-white scale-110' : 'bg-white/10 text-blue-400 group-hover:scale-110'}
        `}>
                    {isDragging ? (
                        <FileUp className="w-8 h-8" />
                    ) : (
                        <Upload className="w-8 h-8" />
                    )}
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                    {isDragging ? 'Drop files here' : 'Upload Images'}
                </h3>

                <p className="text-gray-400 mb-6 text-sm">
                    Drag & drop or click to select files<br />
                    <span className="text-xs text-gray-500 mt-1 block">
                        JPG, PNG, WebP up to 10MB (Batch supported)
                    </span>
                </p>

                {error && (
                    <div className="absolute bottom-4 left-0 right-0 mx-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center gap-2 text-red-200 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
