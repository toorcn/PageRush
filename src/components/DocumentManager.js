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
  const [activeTab, setActiveTab] = useState('active');

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
      // Get all selected documents
      const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
      
      // Pass the array of selected documents to the parent component
      // The parent component will need to handle multiple documents
      onSelectDocument(selectedDocs);
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
    // Check if this document is in the active documents array
    if (Array.isArray(activeDocument)) {
      return activeDocument.some(doc => doc.id === documentId);
    }
    return activeDocument?.id === documentId;
  };

  // Get active document names for display
  const getActiveDocumentNames = () => {
    if (Array.isArray(activeDocument)) {
      return activeDocument.map(doc => doc.name).join(', ');
    }
    return activeDocument?.name || '';
  };

  // Get all active documents for display
  const getActiveDocuments = () => {
    if (Array.isArray(activeDocument)) {
      return activeDocument;
    }
    return activeDocument ? [activeDocument] : [];
  };

  return (
    <div className="h-full fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-full max-h-[95vh] overflow-hidden flex flex-col mx-2">
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

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'active' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Documents ({getActiveDocuments().length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Documents ({documents.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {getActiveDocuments().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <p>No active documents</p>
                  <p className="text-sm">Select documents from the "All Documents" tab to make them active</p>
                </div>
              ) : (
                getActiveDocuments().map((doc) => (
                  <div
                    key={`active-${doc.id}`}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors border-blue-500 bg-blue-50"
                  >
                    {/* Selection Checkbox */}
                    {isMultiSelectMode && (
                      <div className="mb-3">
                        <input
                          type="checkbox"
                          checked={isDocumentSelected(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Select for multi-document operation</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {doc.name}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(doc.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Active
                        </span>
                        <button
                          onClick={() => setShowDeleteConfirm(doc.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="mr-4">📏 {getDocumentSize(doc.text)}</span>
                      <span>{doc.text.substring(0, 100)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload your first document to get started</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      isDocumentActive(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : isDocumentSelected(doc.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {isMultiSelectMode && (
                      <div className="mb-3">
                        <input
                          type="checkbox"
                          checked={isDocumentSelected(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Select for multi-document operation</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {doc.name}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(doc.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isDocumentActive(doc.id) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Active
                          </span>
                        )}
                        {!isDocumentActive(doc.id) && (
                          <button
                            onClick={() => onSelectDocument(doc)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(doc.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="mr-4">📏 {getDocumentSize(doc.text)}</span>
                      <span>{doc.text.substring(0, 100)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {activeTab === 'active' 
              ? `${getActiveDocuments().length} active document${getActiveDocuments().length !== 1 ? 's' : ''}`
              : `${documents.length} document${documents.length !== 1 ? 's' : ''} total`
            }
          </div>
          <div className="flex space-x-2">
            {!isMultiSelectMode ? (
              <>
                <button
                  onClick={() => setIsMultiSelectMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Multiple
                </button>
                <button
                  onClick={handleAddMoreDocuments}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectMultiple}
                  disabled={selectedDocuments.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select ({selectedDocuments.size})
                </button>
              </>
            )}
            {/* <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button> */}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Document?</h3>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. The document will be permanently removed.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemoveDocument(showDeleteConfirm)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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