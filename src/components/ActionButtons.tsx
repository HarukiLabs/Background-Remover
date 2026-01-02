'use client';

import { ActionButtonsProps } from '@/types';

export default function ActionButtons({
    onProcess,
    onDownload,
    onReset,
    canProcess,
    canDownload,
    isProcessing,
}: ActionButtonsProps) {
    return (
        <div className="flex flex-wrap justify-center gap-3 animate-slide-up">
            {/* Process Button */}
            <button
                onClick={onProcess}
                disabled={!canProcess || isProcessing}
                className={`
          min-w-[140px] h-12 px-6 rounded-xl font-medium
          flex items-center justify-center gap-2
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          ${canProcess && !isProcessing
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 focus:ring-purple-500'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
        `}
                aria-busy={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove BG
                    </>
                )}
            </button>

            {/* Download Button */}
            <button
                onClick={onDownload}
                disabled={!canDownload}
                className={`
          min-w-[140px] h-12 px-6 rounded-xl font-medium
          flex items-center justify-center gap-2
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          ${canDownload
                        ? 'bg-green-600 text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 focus:ring-green-500'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
        `}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
            </button>

            {/* Reset Button */}
            <button
                onClick={onReset}
                className="
          min-w-[100px] h-12 px-6 rounded-xl font-medium
          flex items-center justify-center gap-2
          border border-gray-600 text-gray-300
          transition-all duration-300 
          hover:bg-white/5 hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900
        "
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
            </button>
        </div>
    );
}
