'use client';
import { useState, useMemo } from 'react';
import { Library, X, Search, FileText, Check, Trash2, Upload } from 'lucide-react';

export default function DocumentManager({ 
  documents, 
  activeDocument, 
  onSelectDocument, 
  onRemoveDocument, 
  onClose,
  onAddMoreDocuments 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getDocumentSize = (text) => {
    const sizeInKB = Math.round(text.length / 1024);
    if (sizeInKB < 1024) return `${sizeInKB} KB`;
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // Get active documents as array
  const activeDocuments = useMemo(() => {
    if (Array.isArray(activeDocument)) return activeDocument;
    return activeDocument ? [activeDocument] : [];
  }, [activeDocument]);

  const isDocumentActive = (docId) => {
    return activeDocuments.some(doc => doc.id === docId);
  };

  // Filter and sort documents: active first, then by date
  const sortedDocuments = useMemo(() => {
    let filtered = documents;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = documents.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.text.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      const aActive = isDocumentActive(a.id);
      const bActive = isDocumentActive(b.id);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [documents, searchQuery, activeDocuments]);

  const handleToggleDocument = (doc) => {
    const isActive = isDocumentActive(doc.id);
    
    if (isActive) {
      // Prevent unselecting the last active document
      if (activeDocuments?.length <= 1) {
        return; // Don't allow deselecting the only active document
      }
      // Remove from active
      const newActive = activeDocuments.filter(d => d.id !== doc.id);
      onSelectDocument(newActive);
    } else {
      // Add to active
      onSelectDocument([...activeDocuments, doc]);
    }
  };

  const handleRemoveDocument = (documentId) => {
    onRemoveDocument(documentId);
    setShowDeleteConfirm(null);
  };

  const handleAddMoreDocuments = () => {
    if (onAddMoreDocuments) {
      onAddMoreDocuments();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Library className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Documents</h2>
                <p className="text-blue-100 text-sm">
                  {activeDocuments?.length > 0 
                    ? `${activeDocuments?.length} active · ${documents.length} total`
                    : `${documents.length} document${documents.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {documents.length > 3 && (
          <div className="px-5 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No documents yet</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                Upload a PDF to start creating flashcards, quizzes, and study guides
              </p>
              <button
                onClick={handleAddMoreDocuments}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First PDF
              </button>
              <p className="text-xs text-gray-400 mt-4">
                PDFs are processed locally in your browser
              </p>
            </div>
          ) : sortedDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No documents match "{searchQuery}"</p>
            </div>
          ) : (
            sortedDocuments.map((doc) => {
              const isActive = isDocumentActive(doc.id);
              const isLastActive = isActive && activeDocuments?.length === 1;
              return (
                <div
                  key={doc.id}
                  className={`group relative rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div 
                    role="button"
                    tabIndex={0}
                    className={`p-4 ${isLastActive ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => handleToggleDocument(doc)}
                    onKeyDown={(e) => e.key === 'Enter' && handleToggleDocument(doc)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <div 
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isActive 
                            ? isLastActive
                              ? 'bg-blue-400 border-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300 group-hover:border-blue-400'
                        }`}
                        title={isLastActive ? 'At least one document must be selected' : ''}
                      >
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">{doc.name}</h3>
                          {isActive && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              isLastActive 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isLastActive ? 'Required' : 'Active'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{formatDate(doc.timestamp)}</span>
                          <span>•</span>
                          <span>{getDocumentSize(doc.text)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {doc.text.substring(0, 150)}...
                        </p>
                      </div>

                      {/* Delete Button - Always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(doc.id);
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        aria-label={`Delete ${doc.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 fixed-bottom-safe">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {activeDocuments?.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {activeDocuments?.length} selected for study
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Done
              </button>
              {documents.length > 0 && (
                <button
                  onClick={handleAddMoreDocuments}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-slideUp">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Document?</h3>
                <p className="text-gray-600 text-sm mb-6">
                  This will permanently remove the document and cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemoveDocument(showDeleteConfirm)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
