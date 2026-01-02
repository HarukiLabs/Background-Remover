'use client';

import { useEffect, useState } from 'react';
import { StatusMessageProps } from '@/types';

const icons = {
    success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
};

const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

export default function StatusMessage({
    type,
    message,
    onRetry,
    onDismiss,
}: StatusMessageProps) {
    const [isVisible, setIsVisible] = useState(true);

    // Auto-dismiss success messages
    useEffect(() => {
        if (type === 'success' && onDismiss) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [type, onDismiss]);

    if (!isVisible) return null;

    return (
        <div
            className={`
        w-full max-w-md mx-auto p-4 rounded-xl border
        flex items-start gap-3 animate-slide-up
        ${styles[type]}
        ${!isVisible ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        transition-all duration-300
      `}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[type]}
            </div>

            <div className="flex-grow">
                <p className="text-sm">{message}</p>

                {(onRetry || onDismiss) && (
                    <div className="flex gap-2 mt-2">
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="text-xs font-medium px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                Try Again
                            </button>
                        )}
                        {onDismiss && (
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onDismiss, 300);
                                }}
                                className="text-xs font-medium px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Dismiss
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
