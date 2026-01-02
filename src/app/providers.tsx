'use client';

import { QueueProvider } from '@/contexts/QueueContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueueProvider>
            {children}
        </QueueProvider>
    );
}
