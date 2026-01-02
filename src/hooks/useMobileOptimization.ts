/**
 * useMobileOptimization Hook
 * Provides mobile detection and optimization utilities
 */

import { useEffect, useState, useCallback } from 'react';

interface MobileOptimizationState {
    /** Is viewport mobile-sized (<768px) */
    isMobile: boolean;
    /** Is viewport tablet-sized (768px - 1024px) */
    isTablet: boolean;
    /** Is viewport desktop-sized (>1024px) */
    isDesktop: boolean;
    /** Device has touch capability */
    hasTouch: boolean;
    /** Device prefers reduced motion */
    prefersReducedMotion: boolean;
    /** Current viewport width */
    viewportWidth: number;
    /** Device pixel ratio for high-DPI displays */
    devicePixelRatio: number;
}

const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
} as const;

/**
 * Hook for mobile-specific optimizations and responsive behavior
 */
export function useMobileOptimization(): MobileOptimizationState {
    const [state, setState] = useState<MobileOptimizationState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        prefersReducedMotion: false,
        viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    });

    useEffect(() => {
        // Check for SSR
        if (typeof window === 'undefined') return;

        const updateState = () => {
            const width = window.innerWidth;

            setState({
                isMobile: width < BREAKPOINTS.mobile,
                isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
                isDesktop: width >= BREAKPOINTS.tablet,
                hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                viewportWidth: width,
                devicePixelRatio: window.devicePixelRatio,
            });
        };

        // Initial update
        updateState();

        // Listen for resize with throttle
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateState, 100);
        };

        // Listen for media query changes
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleMotionChange = () => updateState();

        window.addEventListener('resize', handleResize);
        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener('resize', handleResize);
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, []);

    return state;
}

/**
 * Get optimal image quality based on device
 */
export function useOptimalImageQuality(): number {
    const { isMobile, devicePixelRatio } = useMobileOptimization();

    // Lower quality on mobile for faster processing
    if (isMobile) {
        return 0.7;
    }

    // Higher quality for high-DPI displays
    if (devicePixelRatio > 1.5) {
        return 0.9;
    }

    return 0.85;
}

/**
 * Get optimal thumbnail size based on device
 */
export function useOptimalThumbnailSize(): number {
    const { isMobile, isTablet, devicePixelRatio } = useMobileOptimization();

    const baseSize = isMobile ? 200 : isTablet ? 300 : 400;

    // Account for retina displays but cap at 2x
    const multiplier = Math.min(devicePixelRatio, 2);

    return Math.round(baseSize * multiplier);
}

/**
 * Hook to check if animations should be reduced
 */
export function useShouldReduceMotion(): boolean {
    const { prefersReducedMotion } = useMobileOptimization();
    return prefersReducedMotion;
}

/**
 * Hook to get adaptive debounce delay
 * Shorter delays on desktop, longer on mobile
 */
export function useAdaptiveDelay(): {
    debounceDelay: number;
    throttleDelay: number;
} {
    const { isMobile } = useMobileOptimization();

    return {
        debounceDelay: isMobile ? 400 : 250,
        throttleDelay: isMobile ? 150 : 100,
    };
}
