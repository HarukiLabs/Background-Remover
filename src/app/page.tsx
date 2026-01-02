'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useQueue } from '@/contexts/QueueContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UploadZone from '@/components/UploadZone';
import BatchControls from '@/components/BatchControls';
import ModeSelectionModal from '@/components/ModeSelectionModal';

const QueueGrid = dynamic(() => import('@/components/QueueGrid'), {
  ssr: false,
  loading: () => <div className="w-full h-64 flex items-center justify-center text-gray-400">Loading grid...</div>
});

export default function Home() {
  const {
    queue,
    isProcessing,
  } = useQueue();

  const hasItems = queue.length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload-first workflow state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showModeModal, setShowModeModal] = useState(false);

  // Step 1: User uploads files → show modal with previews
  const handleFileSelect = (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
    setShowModeModal(true);
  };

  // Add more files to pending list
  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const handleAdditionalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = ''; // Reset for next use
  };

  // Remove a file from pending list
  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));

    // If no files left, close modal
    if (pendingFiles.length <= 1) {
      setShowModeModal(false);
    }
  };

  // Complete processing (modal handles everything internally now)
  const handleComplete = () => {
    setShowModeModal(false);
    setPendingFiles([]);
  };

  // Cancel upload
  const handleCancelUpload = () => {
    setShowModeModal(false);
    setPendingFiles([]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-3 sm:p-4 md:p-8 pb-20 md:pb-24 max-w-7xl mx-auto safe-area-bottom">
      <Header />

      {/* Hidden file input for "Add More" functionality */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleAdditionalFiles}
      />

      {/* Upload Section */}
      <div className={`w-full transition-all duration-300 ${hasItems ? 'my-4' : 'my-12 md:my-24'}`}>
        <UploadZone
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
          disabled={isProcessing}
        />
      </div>

      {/* Queue Grid */}
      {hasItems && (
        <div className="w-full flex-grow animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-semibold text-white">Project Files ({queue.length})</h2>
            <span className="text-sm text-gray-400">
              {isProcessing ? 'Processing files...' : 'Ready to process'}
            </span>
          </div>

          <QueueGrid />
        </div>
      )}

      {/* Batch Controls (Pinned to bottom) */}
      <BatchControls />

      {!hasItems && <Footer />}

      {/* Mode Selection Modal - handles processing internally */}
      {showModeModal && pendingFiles.length > 0 && (
        <ModeSelectionModal
          files={pendingFiles}
          onComplete={handleComplete}
          onCancel={handleCancelUpload}
          onAddMore={handleAddMore}
          onRemoveFile={handleRemoveFile}
        />
      )}
    </main>
  );
}
