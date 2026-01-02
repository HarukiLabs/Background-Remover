'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ImageComparisonProps } from '@/types';
import Image from 'next/image';

export default function ImageComparison({ originalSrc, processedSrc }: ImageComparisonProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateSliderPosition = useCallback((clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updateSliderPosition(e.clientX);
    }, [updateSliderPosition]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        updateSliderPosition(e.touches[0].clientX);
    }, [updateSliderPosition]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateSliderPosition(e.clientX);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                updateSliderPosition(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, updateSliderPosition]);

    return (
        <div className="w-full max-w-2xl mx-auto animate-slide-up">
            <div
                ref={containerRef}
                className="relative aspect-video rounded-2xl overflow-hidden glass-card cursor-ew-resize select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                role="slider"
                aria-label="Image comparison slider"
                aria-valuenow={Math.round(sliderPosition)}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                        setSliderPosition((prev) => Math.max(0, prev - 5));
                    } else if (e.key === 'ArrowRight') {
                        setSliderPosition((prev) => Math.min(100, prev + 5));
                    }
                }}
            >
                {/* Checkered background for transparency */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
              linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
              linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
            `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                />

                {/* Processed image (background) */}
                <div className="absolute inset-0">
                    <Image
                        src={processedSrc}
                        alt="Processed image with background removed"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>

                {/* Original image (clipped) */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <Image
                        src={originalSrc}
                        alt="Original image"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>

                {/* Slider line */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                    {/* Slider handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-gray-800"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                            />
                        </svg>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                    Original
                </div>
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                    Removed
                </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-3">
                Drag the slider to compare before & after
            </p>
        </div>
    );
}
