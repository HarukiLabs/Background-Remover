'use client';

import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
    /** Optional error reporting callback */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    /** Optional reset callback */
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI.
 * 
 * Features:
 * - Custom fallback UI support
 * - Error reporting callback
 * - Reset callback for custom cleanup
 * - Detailed error information for debugging
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Update state with error info for detailed display
        this.setState({ errorInfo });

        // Log error without sensitive data
        console.error('Error boundary caught:', error.name, error.message);
        console.error('Component stack:', errorInfo.componentStack?.slice(0, 500));

        // Call optional error reporting callback
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        // Call optional reset callback for custom cleanup
        this.props.onReset?.();

        // Reset error state
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="w-full max-w-md mx-auto p-6 glass-card rounded-2xl text-center animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>

                    {/* Error details for development */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="text-left mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                            <summary className="text-xs text-red-400 cursor-pointer">
                                Error Details (dev only)
                            </summary>
                            <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-32">
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="px-6 py-2 min-h-[44px] rounded-xl bg-white/10 text-gray-400 font-medium hover:bg-white/20 transition-all"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
