'use client';

import { useDocumentStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui';

export function Header() {
  const { documents, activeDocuments } = useDocumentStore();
  const {
    setShowUploadModal,
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
          {activeDocuments.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">📄</span>
              <span className="text-sm font-medium text-gray-700">
                {activeDocuments.map((doc) => doc.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(true)}
            icon="📄"
          >
            Upload
          </Button>
          <Button variant="secondary" onClick={toggleDocumentManager}>
            📚 Documents ({documents.length})
          </Button>
          <Button variant="secondary" onClick={toggleHistory}>
            📊 History
          </Button>
          <Button onClick={() => setShowFeatureSelector(true)} icon="✨">
            Study Tools
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-5 w-3/4"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2 bg-blue-100 rounded-lg text-blue-700 hover:bg-blue-200 transition-colors"
              title="Upload PDF"
            >
              📄
            </button>
            <button
              onClick={toggleDocumentManager}
              className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              title="Documents"
            >
              📚
            </button>
            <button
              onClick={toggleHistory}
              className="p-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              title="History"
            >
              📊
            </button>
            <button
              onClick={() => setShowFeatureSelector(true)}
              className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white hover:from-green-700 hover:to-emerald-700 transition-colors"
              title="Study Tools"
            >
              ✨
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
}
