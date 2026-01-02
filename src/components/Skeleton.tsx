'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
    className?: string;
    /** Animation type */
    animation?: 'pulse' | 'wave' | 'none';
    /** Border radius preset */
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    /** Custom inline styles */
    style?: React.CSSProperties;
}

/**
 * Base Skeleton component
 * Displays a placeholder loading animation
 */
export function Skeleton({
    className,
    animation = 'pulse',
    rounded = 'md',
    style,
}: SkeletonProps) {
    const roundedClasses = {
        none: 'rounded-none',
        sm: 'rounded',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'skeleton-wave',
        none: '',
    };

    return (
        <div
            className={clsx(
                'bg-white/10',
                roundedClasses[rounded],
                animationClasses[animation],
                className
            )}
            style={style}
            aria-hidden="true"
        />
    );
}

/**
 * Image placeholder skeleton
 */
export function ImageSkeleton({
    className,
    aspectRatio = 'video',
}: {
    className?: string;
    aspectRatio?: 'video' | 'square' | 'portrait';
}) {
    const aspectClasses = {
        video: 'aspect-video',
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
    };

    return (
        <Skeleton
            className={clsx('w-full', aspectClasses[aspectRatio], className)}
            rounded="lg"
        />
    );
}

/**
 * Text line skeleton
 */
export function TextSkeleton({
    lines = 1,
    lastLineWidth = '60%',
    className,
}: {
    lines?: number;
    lastLineWidth?: string;
    className?: string;
}) {
    return (
        <div className={clsx('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    rounded="sm"
                    style={{
                        width: i === lines - 1 ? lastLineWidth : '100%'
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({
    size = 'md',
    className,
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        sm: 'h-8 w-20',
        md: 'h-10 w-28',
        lg: 'h-12 w-36',
    };

    return (
        <Skeleton
            className={clsx(sizeClasses[size], className)}
            rounded="lg"
        />
    );
}

/**
 * Card skeleton
 */
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={clsx('space-y-3 p-4 bg-white/5 rounded-xl border border-white/10', className)}>
            <ImageSkeleton aspectRatio="video" />
            <TextSkeleton lines={2} />
            <div className="flex gap-2">
                <ButtonSkeleton size="sm" />
                <ButtonSkeleton size="sm" />
            </div>
        </div>
    );
}

/**
 * Grid of card skeletons
 */
export function GridSkeleton({
    count = 4,
    columns = 'auto',
}: {
    count?: number;
    columns?: 'auto' | 2 | 3 | 4;
}) {
    const columnClasses = {
        auto: 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };

    return (
        <div className={clsx('grid gap-4', columnClasses[columns])}>
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * Processing preview skeleton
 */
export function PreviewSkeleton({ className }: { className?: string }) {
    return (
        <div className={clsx('flex flex-col gap-4 p-4', className)}>
            <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8" rounded="full" />
                <Skeleton className="h-4 w-32" rounded="sm" />
            </div>
            <ImageSkeleton aspectRatio="video" />
            <div className="flex gap-2">
                <Skeleton className="flex-1 h-10" rounded="lg" />
                <Skeleton className="flex-1 h-10" rounded="lg" />
            </div>
        </div>
    );
}

export default Skeleton;
