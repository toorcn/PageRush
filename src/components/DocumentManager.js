'use client';
import React, { useState } from 'react';

export default function DocumentManager({ 
  documents, 
  activeDocument, 
  onSelectDocument, 
  onRemoveDocument, 
  onClose,
  onAddMoreDocuments 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const getDocumentSize = (text) => {
    const sizeInKB = Math.round(text.length / 1024);
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    }
  };

  const handleRemoveDocument = (documentId) => {
    onRemoveDocument(documentId);
    setShowDeleteConfirm(null);
    // Remove from selected documents if it was selected
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
  };

  const toggleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleSelectMultiple = () => {
    if (selectedDocuments.size > 0) {
      // Use the first selected document as active, but keep track of all selected
      const firstSelectedId = Array.from(selectedDocuments)[0];
      const firstSelectedDoc = documents.find(doc => doc.id === firstSelectedId);
      if (firstSelectedDoc) {
        onSelectDocument(firstSelectedDoc);
      }
    }
    setIsMultiSelectMode(false);
    setSelectedDocuments(new Set());
  };

  const handleUnselectDocument = (documentId) => {
    // If this was the active document, clear the active document
    if (activeDocument?.id === documentId) {
      onSelectDocument(null);
    }
  };

  const handleAddMoreDocuments = () => {
    if (onAddMoreDocuments) {
      onAddMoreDocuments();
    }
    onClose();
  };

  const isDocumentSelected = (documentId) => {
    return selectedDocuments.has(documentId);
  };

  const isDocumentActive = (documentId) => {
    return activeDocument?.id === documentId;
  };

  return (
    <div className="h-full fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">📚 Document Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Documents</h3>
              <p className="text-gray-600">Upload your first document to get started</p>
              <button
                onClick={handleAddMoreDocuments}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Documents
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Multi-select Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3 flex-wrap">
                  <button
                    onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      isMultiSelectMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {isMultiSelectMode ? '✓ Multi-Select Mode' : 'Select Multiple'}
                  </button>
                  {isMultiSelectMode && selectedDocuments.size > 0 && (
                    <button
                      onClick={handleSelectMultiple}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Use Selected ({selectedDocuments.size})
                    </button>
                  )}
                </div>
                <button
                  onClick={handleAddMoreDocuments}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  + Add More Documents
                </button>
              </div>

              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    isMultiSelectMode && isDocumentSelected(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : isDocumentActive(doc.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {isMultiSelectMode ? (
                          <input
                            type="checkbox"
                            checked={isDocumentSelected(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <div className={`w-3 h-3 rounded-full ${
                            isDocumentActive(doc.id) ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {doc.name}
                          </h3>
                          {isDocumentActive(doc.id) && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex-shrink-0">
                              Active
                            </span>
                          )}
                          {isMultiSelectMode && isDocumentSelected(doc.id) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>{getDocumentSize(doc.text)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {doc.text.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {!isMultiSelectMode && !isDocumentActive(doc.id) && (
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Select
                        </button>
                      )}
                      {isDocumentActive(doc.id) && (
                        <button
                          onClick={() => handleUnselectDocument(doc.id)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                          Unselect
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteConfirm(doc.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''} total
            {isMultiSelectMode && selectedDocuments.size > 0 && (
              <span className="ml-2 text-blue-600">
                • {selectedDocuments.size} selected
              </span>
            )}
            {activeDocument && (
              <span className="ml-2 text-green-600">
                • 1 active
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Remove Document</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this document? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveDocument(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 