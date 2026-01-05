'use client';

import { useDocumentStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import { FileText, FolderOpen, Library, Sparkles } from 'lucide-react';

export function Header() {
  const { documents, activeDocuments } = useDocumentStore();
  const {
    toggleDocumentManager,
    toggleHistory,
    setShowFeatureSelector,
  } = useUIStore();

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-12 w-auto"
          />
          {activeDocuments?.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">
                {activeDocuments.map((doc) => doc.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={toggleDocumentManager}>
            <FolderOpen className="w-4 h-4" />
            Documents ({documents.length})
          </Button>
          <Button variant="secondary" onClick={toggleHistory}>
            <Library className="w-4 h-4" />
            Library
          </Button>
          <Button onClick={() => setShowFeatureSelector(true)}>
            <Sparkles className="w-4 h-4" />
            Study Tools
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-8 max-h-8 w-auto max-w-[140px]"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDocumentManager}
              className="p-2.5 bg-gray-100 rounded-lg text-gray-600 active:bg-gray-300 transition-colors touch-manipulation"
              title="Documents"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={toggleHistory}
              className="p-2.5 bg-gray-100 rounded-lg text-gray-600 active:bg-gray-300 transition-colors touch-manipulation"
              title="Study Library"
            >
              <Library className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowFeatureSelector(true)}
              className="p-2.5 bg-indigo-600 rounded-lg text-white active:bg-indigo-800 transition-colors shadow-md touch-manipulation"
              title="Study Tools"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Spacer - matches header height + safe area */}
      <div className="lg:hidden" style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} />
    </>
  );
}
