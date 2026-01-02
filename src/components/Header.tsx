'use client';

export default function Header() {
    return (
        <header className="w-full py-6 px-4 md:px-8 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-3">
                {/* Animated icon */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl rotate-6 animate-pulse opacity-75" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl -rotate-3" />
                    <svg
                        className="relative z-10 w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Nacht Remover
                </h1>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
                Remove backgrounds from your images instantly, right in your browser.
                <span className="block mt-1 text-xs text-gray-500">
                    No uploads to servers • 100% private • Free forever
                </span>
            </p>
        </header>
    );
}
