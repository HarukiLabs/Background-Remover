import { DBSchema, openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'bg-remover-db';
const DB_VERSION = 1;

export interface ImageRecord {
    id: string;
    originalBlob: Blob;
    processedBlob?: Blob;
    thumbnailBlob?: Blob;
    name: string;
    type: string;
    size: number;
    width?: number;
    height?: number;
    createdAt: number;
    hash?: string; // For deduplication
}

interface BGRemoverDB extends DBSchema {
    images: {
        key: string;
        value: ImageRecord;
        indexes: { 'by-date': number };
    };
    settings: {
        key: string;
        value: any;
    };
}

let dbPromise: Promise<IDBPDatabase<BGRemoverDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<BGRemoverDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create images store
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { keyPath: 'id' });
                    store.createIndex('by-date', 'createdAt');
                }
                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            },
        });
    }
    return dbPromise;
}

export const db = {
    async saveImage(record: ImageRecord): Promise<string> {
        const db = await getDB();
        await db.put('images', record);
        return record.id;
    },

    async getImage(id: string): Promise<ImageRecord | undefined> {
        const db = await getDB();
        return db.get('images', id);
    },

    async updateImage(id: string, updates: Partial<ImageRecord>): Promise<void> {
        const db = await getDB();
        const existing = await db.get('images', id);
        if (existing) {
            await db.put('images', { ...existing, ...updates });
        }
    },

    async deleteImage(id: string): Promise<void> {
        const db = await getDB();
        await db.delete('images', id);
    },

    async getAllKeys(): Promise<string[]> {
        const db = await getDB();
        const keys = await db.getAllKeys('images');
        return keys.map(String);
    },

    async clearAllImages(): Promise<void> {
        const db = await getDB();
        await db.clear('images');
    },

    async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0
            };
        }
        return { usage: 0, quota: 0 };
    }
};
