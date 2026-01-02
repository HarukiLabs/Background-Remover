import { ProcessingProgress, WorkerMessage, WorkerResponse } from '@/types';

type JobId = string;

export interface WorkerJob {
    id: JobId;
    file: File;
    onStart: () => void;
    onProgress: (progress: ProcessingProgress) => void;
    onComplete: (resultBlob: Blob) => void;
    onError: (error: string) => void;
}

interface WorkerWrapper {
    id: number;
    worker: Worker;
    busy: boolean;
    currentJobId?: JobId;
}

const MAX_CONCURRENCY = 2; // Strict limit

class WorkerPool {
    private workers: WorkerWrapper[] = [];
    private queue: WorkerJob[] = [];
    private activeJobs: Map<JobId, WorkerJob> = new Map();
    private initialized = false;

    init() {
        if (this.initialized) return;

        for (let i = 0; i < MAX_CONCURRENCY; i++) {
            const worker = new Worker(
                new URL('../workers/backgroundRemoval.worker.ts', import.meta.url),
                { type: 'module' }
            );

            worker.onmessage = (e) => this.handleMessage(i, e);
            worker.postMessage({ type: 'init' });

            this.workers.push({
                id: i,
                worker,
                busy: false
            });
        }

        this.initialized = true;
    }

    addJob(job: WorkerJob) {
        if (!this.initialized) this.init();
        this.queue.push(job);
        this.processNext();
    }

    cancelJob(id: JobId) {
        // Remove from queue
        this.queue = this.queue.filter(job => job.id !== id);

        // If active, we might need to terminate worker to truly cancel
        // For now, just remove from map and ignore result
        if (this.activeJobs.has(id)) {
            this.activeJobs.delete(id);
            // Find worker processing this job and reset it
            const worker = this.workers.find(w => w.currentJobId === id);
            if (worker) {
                // Hard reset worker to stop processing
                worker.worker.terminate();

                // Re-create worker
                const newWorker = new Worker(
                    new URL('../workers/backgroundRemoval.worker.ts', import.meta.url),
                    { type: 'module' }
                );
                newWorker.onmessage = (e) => this.handleMessage(worker.id, e);
                newWorker.postMessage({ type: 'init' });

                worker.worker = newWorker;
                worker.busy = false; // It's resetting, but we can treat as free once init? 
                // Actually, wait for ready? For simplicity, we assume ready fast or let it buffer next msg.
                worker.currentJobId = undefined;
                this.processNext();
            }
        }
    }

    private async processNext() {
        const freeWorker = this.workers.find(w => !w.busy);
        if (!freeWorker || this.queue.length === 0) return;

        const job = this.queue.shift();
        if (!job) return;

        freeWorker.busy = true;
        freeWorker.currentJobId = job.id;
        this.activeJobs.set(job.id, job);

        job.onStart();

        // Prepare ArrayBuffer for transfer
        try {
            const arrayBuffer = await job.file.arrayBuffer();
            freeWorker.worker.postMessage(
                { type: 'process', imageData: arrayBuffer, mimeType: job.file.type },
                [arrayBuffer]
            );
        } catch (err) {
            job.onError("Failed to read file");
            this.releaseWorker(freeWorker);
        }
    }

    private handleMessage(workerId: number, event: MessageEvent<WorkerResponse>) {
        const workerWrapper = this.workers.find(w => w.id === workerId);
        if (!workerWrapper) return;

        const jobId = workerWrapper.currentJobId;
        if (!jobId) return; // Should not happen unless stray message

        const job = this.activeJobs.get(jobId);
        if (!job) return; // Job cancelled

        const { type } = event.data;

        switch (type) {
            case 'progress':
                if (event.data.type === 'progress') {
                    job.onProgress({
                        percent: event.data.percent,
                        stage: event.data.stage
                    });
                }
                break;

            case 'complete':
                if (event.data.type === 'complete') {
                    job.onComplete(event.data.resultBlob);
                    this.activeJobs.delete(jobId);
                    this.releaseWorker(workerWrapper);
                }
                break;

            case 'error':
                if (event.data.type === 'error') {
                    job.onError(event.data.message);
                    this.activeJobs.delete(jobId);
                    this.releaseWorker(workerWrapper);
                }
                break;

            case 'ready':
                // Worker ready signal, ignore
                break;
        }
    }

    private releaseWorker(worker: WorkerWrapper) {
        worker.busy = false;
        worker.currentJobId = undefined;
        this.processNext();
    }

    // Public getters for internal state
    getActiveCount(): number {
        return this.activeJobs.size;
    }

    getQueueLength(): number {
        return this.queue.length;
    }
}

export const workerPool = new WorkerPool();
