/**
 * useAbortController Hook
 * Provides cancellable async operations with automatic cleanup on unmount
 */

import { useRef, useEffect, useCallback } from 'react';

interface UseAbortControllerReturn {
    /** Get a new AbortController, cancelling the previous one */
    getController: () => AbortController;
    /** Get current signal (may be undefined if no controller created) */
    signal: AbortSignal | undefined;
    /** Manually abort current operation */
    abort: () => void;
    /** Check if current operation was aborted */
    isAborted: () => boolean;
}

/**
 * Hook for managing AbortController lifecycle
 * Automatically cancels operations on unmount
 */
export function useAbortController(): UseAbortControllerReturn {
    const controllerRef = useRef<AbortController | null>(null);

    // Create or replace controller
    const getController = useCallback(() => {
        // Abort previous if exists
        if (controllerRef.current) {
            controllerRef.current.abort();
        }

        // Create new controller
        controllerRef.current = new AbortController();
        return controllerRef.current;
    }, []);

    // Get current signal
    const signal = controllerRef.current?.signal;

    // Manual abort
    const abort = useCallback(() => {
        controllerRef.current?.abort();
    }, []);

    // Check if aborted
    const isAborted = useCallback(() => {
        return controllerRef.current?.signal.aborted ?? false;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
        };
    }, []);

    return { getController, signal, abort, isAborted };
}

/**
 * Hook for managing multiple named AbortControllers
 */
export function useAbortControllers(): {
    getController: (key: string) => AbortController;
    abort: (key: string) => void;
    abortAll: () => void;
} {
    const controllersRef = useRef<Map<string, AbortController>>(new Map());

    const getController = useCallback((key: string) => {
        // Abort existing with same key
        const existing = controllersRef.current.get(key);
        if (existing) {
            existing.abort();
        }

        // Create new
        const controller = new AbortController();
        controllersRef.current.set(key, controller);
        return controller;
    }, []);

    const abort = useCallback((key: string) => {
        const controller = controllersRef.current.get(key);
        if (controller) {
            controller.abort();
            controllersRef.current.delete(key);
        }
    }, []);

    const abortAll = useCallback(() => {
        controllersRef.current.forEach((controller) => controller.abort());
        controllersRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            controllersRef.current.forEach((controller) => controller.abort());
            controllersRef.current.clear();
        };
    }, []);

    return { getController, abort, abortAll };
}
