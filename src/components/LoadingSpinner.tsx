'use client';

import { LoadingSpinnerProps } from '@/types';

export default function LoadingSpinner({ progress }: LoadingSpinnerProps) {
    return (
        <div className="w-full max-w-md mx-auto p-6 glass-card rounded-2xl animate-fade-in">
            <div className="flex flex-col items-center gap-4">
                {/* Spinning circle */}
                <div className="relative w-20 h-20">
                    {/* Background circle */}
                    <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-700"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={226}
                            strokeDashoffset={226 - (226 * progress.percent) / 100}
                            className="transition-all duration-300"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                            {progress.percent}%
                        </span>
                    </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                    <p className="text-white font-medium">{progress.stage}</p>
                    {progress.estimatedTimeRemaining && (
                        <p className="text-gray-400 text-sm mt-1">
                            ~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining
                        </p>
                    )}
                </div>

                {/* Animated dots */}
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
