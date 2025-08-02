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
    <div className="h-full fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b flex-shrink-0">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800">📚 Document Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl lg:text-3xl p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 lg:p-6 border-b">
            <div className="flex items-center space-x-2">
              <span className="text-sm lg:text-base text-gray-600">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
              {activeDocument && (
                <span className="text-sm lg:text-base text-blue-600 font-medium">
                  • Active: {activeDocument.name}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {!isMultiSelectMode ? (
                <>
                  <button
                    onClick={() => setIsMultiSelectMode(true)}
                    className="px-3 py-2 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Multiple
                  </button>
                  <button
                    onClick={handleAddMoreDocuments}
                    className="px-3 py-2 text-sm lg:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add More
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(false);
                      setSelectedDocuments(new Set());
                    }}
                    className="px-3 py-2 text-sm lg:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectMultiple}
                    disabled={selectedDocuments.size === 0}
                    className="px-3 py-2 text-sm lg:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select ({selectedDocuments.size})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">No Documents</h3>
                <p className="text-gray-600 text-sm lg:text-base mb-6">Upload your first document to get started</p>
                <button
                  onClick={handleAddMoreDocuments}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`relative p-4 lg:p-5 rounded-lg border-2 transition-all duration-200 ${
                      isDocumentActive(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : isDocumentSelected(doc.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {isMultiSelectMode && (
                      <div className="absolute top-3 left-3">
                        <input
                          type="checkbox"
                          checked={isDocumentSelected(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Document Content */}
                    <div className={`${isMultiSelectMode ? 'ml-8' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl lg:text-3xl">📄</span>
                            <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">
                              {doc.name}
                            </h3>
                            {isDocumentActive(doc.id) && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs lg:text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                              <span>📅 {formatDate(doc.timestamp)}</span>
                              <span>📏 {getDocumentSize(doc.text)}</span>
                            </div>
                            <div className="text-gray-500 truncate">
                              {doc.text.substring(0, 100)}...
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!isDocumentActive(doc.id) && (
                            <button
                              onClick={() => onSelectDocument(doc)}
                              className="px-3 py-1 lg:px-4 lg:py-2 text-xs lg:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Select
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(doc.id)}
                            className="px-2 py-1 lg:px-3 lg:py-2 text-xs lg:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl mb-4">⚠️</div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2">Delete Document?</h3>
                <p className="text-gray-600 text-sm lg:text-base mb-6">
                  This action cannot be undone. The document will be permanently removed.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 text-sm lg:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemoveDocument(showDeleteConfirm)}
                    className="flex-1 px-4 py-3 text-sm lg:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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