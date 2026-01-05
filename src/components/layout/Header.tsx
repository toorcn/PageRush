'use client';

import { useDocumentStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import { FileText, FolderOpen, Library, Sparkles, X, Plus } from 'lucide-react';

export function Header() {
  const { documents, activeDocuments, setActiveDocuments } = useDocumentStore();
  const {
    toggleDocumentManager,
    toggleHistory,
    setShowFeatureSelector,
  } = useUIStore();

  // Remove a document from active selection
  const handleRemoveFromActive = (docId: number) => {
    if (activeDocuments.length <= 1) return; // Keep at least one
    const newActive = activeDocuments.filter(d => d.id !== docId);
    setActiveDocuments(newActive);
  };

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
          {/* Document Chips */}
          {activeDocuments?.length > 0 && (
            <div className="flex items-center gap-2 max-w-md overflow-x-auto scrollbar-hide">
              {activeDocuments.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 max-w-[160px] group flex-shrink-0
                    ${index === 0
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }
                  `}
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{doc.name}</span>
                  {index === 0 && activeDocuments.length > 1 && (
                    <span className="px-1 py-0.5 bg-indigo-200 text-indigo-800 rounded text-xs flex-shrink-0">
                      1st
                    </span>
                  )}
                  {activeDocuments.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromActive(doc.id);
                      }}
                      className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {documents.length > activeDocuments.length && (
                <button
                  onClick={toggleDocumentManager}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors flex-shrink-0"
                  title="Add more documents"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
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
      <div className="lg:hidden bg-white border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-8 max-h-8 w-auto max-w-[140px]"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDocumentManager}
              className="p-2.5 bg-gray-100 rounded-lg text-gray-600 active:bg-gray-300 transition-colors touch-manipulation relative"
              title="Documents"
            >
              <FolderOpen className="w-5 h-5" />
              {activeDocuments?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeDocuments.length}
                </span>
              )}
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
    </>
  );
}
