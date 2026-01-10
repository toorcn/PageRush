'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Library, X, Search, FileText, Check, Trash2, Upload, CheckSquare, Square, Hash, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';

// Helper to estimate word count
const getWordCount = (text) => {
  const words = text.trim().split(/\s+/).length;
  if (words < 1000) return `~${words} words`;
  return `~${Math.round(words / 1000)}k words`;
};

// Document Item Component
function DocumentItem({ doc, isActive, onToggle, onDelete, formatDate, getDocumentSize }) {
  return (
    <div
      className={`group relative rounded-xl border-2 transition-all duration-200 ${
        isActive
          ? 'border-blue-500 bg-blue-50/50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div 
        role="button"
        tabIndex={0}
        className="p-4 cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      >
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <div 
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              isActive 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-300 group-hover:border-blue-400'
            }`}
          >
            {isActive && <Check className="w-3 h-3 text-white" />}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">{doc.name}</h3>
              {isActive && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-blue-100 text-blue-700">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>{formatDate(doc.timestamp)}</span>
              <span className="hidden sm:inline">•</span>
              <span>{getDocumentSize(doc.text)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{getWordCount(doc.text)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {doc.text.substring(0, 200).replace(/\s+/g, ' ').trim()}...
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(doc.id);
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
}

// Document List Component (no grouping)
function DocumentList({ docs, isDocumentActive, handleToggleDocument, setShowDeleteConfirm, formatDate, getDocumentSize }) {
  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const isActive = isDocumentActive(doc.id);
        return (
          <DocumentItem
            key={doc.id}
            doc={doc}
            isActive={isActive}
            onToggle={() => handleToggleDocument(doc)}
            onDelete={setShowDeleteConfirm}
            formatDate={formatDate}
            getDocumentSize={getDocumentSize}
          />
        );
      })}
    </div>
  );
}

// Document Group Component (with header)
function DocumentGroup({ title, docs, isDocumentActive, handleToggleDocument, setShowDeleteConfirm, formatDate, getDocumentSize }) {
  if (docs.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 py-2">
        <Hash className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
        <span className="text-xs text-gray-400">({docs.length})</span>
      </div>
      <DocumentList 
        docs={docs}
        isDocumentActive={isDocumentActive}
        handleToggleDocument={handleToggleDocument}
        setShowDeleteConfirm={setShowDeleteConfirm}
        formatDate={formatDate}
        getDocumentSize={getDocumentSize}
      />
    </div>
  );
}

// Filter/Sort Dropdown Component
function FilterSortDropdown({ 
  filterBy, 
  setFilterBy, 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder,
  onClose 
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <Filter className="w-3.5 h-3.5" />
          Filter by Status
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilterBy(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterBy === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          <ArrowUpDown className="w-3.5 h-3.5" />
          Sort by
        </div>
        <div className="space-y-1">
          {[
            { value: 'date', label: 'Date Added' },
            { value: 'name', label: 'Name' },
            { value: 'size', label: 'Size' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => {
                if (sortBy === option.value) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(option.value);
                  setSortOrder(option.value === 'name' ? 'asc' : 'desc');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                sortBy === option.value
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{option.label}</span>
              {sortBy === option.value && (
                <span className="text-xs text-blue-500">
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onClose}
          className="w-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

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
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Local state for pending selections - only saved when "Done" is clicked
  const initialActiveDocuments = useMemo(() => {
    if (Array.isArray(activeDocument)) return activeDocument;
    return activeDocument ? [activeDocument] : [];
  }, []);
  
  const [pendingSelections, setPendingSelections] = useState(initialActiveDocuments);

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

  // Use pending selections for display (not saved until Done is clicked)
  const activeDocuments = pendingSelections;

  const isDocumentActive = (docId) => {
    return pendingSelections.some(doc => doc.id === docId);
  };

  // Group documents by time period
  const groupedDocuments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let filtered = documents;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) ||
        doc.text.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterBy === 'active') {
      filtered = filtered.filter(doc => isDocumentActive(doc.id));
    } else if (filterBy === 'inactive') {
      filtered = filtered.filter(doc => !isDocumentActive(doc.id));
    }

    // Sort documents based on sortBy and sortOrder
    const sorted = [...filtered].sort((a, b) => {
      // First, pin active documents to top (unless filtering by status)
      if (filterBy === 'all') {
        const aActive = isDocumentActive(a.id);
        const bActive = isDocumentActive(b.id);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
      }
      
      // Then apply the selected sort
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.text.length - b.text.length;
          break;
        case 'date':
        default:
          comparison = new Date(b.timestamp) - new Date(a.timestamp);
          // For date, desc means newest first (which is the natural order)
          return sortOrder === 'desc' ? comparison : -comparison;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Only group if we have more than 5 documents and sorting by date
    if (sorted.length <= 5 || sortBy !== 'date') {
      return { all: sorted };
    }

    const groups = { today: [], thisWeek: [], older: [] };
    sorted.forEach(doc => {
      const docDate = new Date(doc.timestamp);
      if (docDate >= today) {
        groups.today.push(doc);
      } else if (docDate >= weekAgo) {
        groups.thisWeek.push(doc);
      } else {
        groups.older.push(doc);
      }
    });

    return groups;
  }, [documents, searchQuery, activeDocuments, filterBy, sortBy, sortOrder]);

  // For backward compatibility
  const sortedDocuments = useMemo(() => {
    if (groupedDocuments.all) return groupedDocuments.all;
    return [...groupedDocuments.today, ...groupedDocuments.thisWeek, ...groupedDocuments.older];
  }, [groupedDocuments]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to close (saves changes) - only if something is selected
      if (e.key === 'Escape') {
        if (showFilterSort) {
          setShowFilterSort(false);
          return;
        }
        if (pendingSelections.length > 0) {
          onSelectDocument(pendingSelections);
          onClose();
        }
      }
      // Cmd/Ctrl + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && documents.length > 0) {
        e.preventDefault();
        setPendingSelections(documents);
      }
    };
    
    // Click outside to close filter dropdown
    const handleClickOutside = (e) => {
      if (showFilterSort && !e.target.closest('[data-filter-dropdown]')) {
        setShowFilterSort(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [documents, pendingSelections, onSelectDocument, onClose, showFilterSort]);

  // Select all / Deselect all handlers
  const handleSelectAll = useCallback(() => {
    setPendingSelections(documents);
  }, [documents]);

  const handleSelectFirstOnly = useCallback(() => {
    if (documents.length > 0) {
      setPendingSelections([documents[0]]);
    }
  }, [documents]);

  const handleToggleDocument = (doc) => {
    const isActive = isDocumentActive(doc.id);
    
    if (isActive) {
      // Allow unselecting any document, including the last one
      const newActive = pendingSelections.filter(d => d.id !== doc.id);
      setPendingSelections(newActive);
    } else {
      // Add to active
      setPendingSelections([...pendingSelections, doc]);
    }
  };

  const handleRemoveDocument = (documentId) => {
    // Also remove from pending selections if it was selected
    setPendingSelections(prev => prev.filter(d => d.id !== documentId));
    onRemoveDocument(documentId);
    setShowDeleteConfirm(null);
  };

  // Save selections and close
  const handleDone = useCallback(() => {
    onSelectDocument(pendingSelections);
    onClose();
  }, [pendingSelections, onSelectDocument, onClose]);

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

        {/* Search Bar & Bulk Actions */}
        {documents.length > 1 && (
          <div className="px-5 pt-4 space-y-3">
            {/* Search and Filter/Sort Row */}
            <div className="flex items-center gap-2">
              {/* Search */}
              {documents.length > 3 && (
                <div className="relative flex-1">
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
              )}
              
              {/* Filter/Sort Button */}
              <div className="relative" data-filter-dropdown>
                <button
                  onClick={() => setShowFilterSort(!showFilterSort)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    showFilterSort || filterBy !== 'all' || sortBy !== 'date'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter & Sort</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterSort ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterSort && (
                  <FilterSortDropdown
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onClose={() => setShowFilterSort(false)}
                  />
                )}
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(filterBy !== 'all' || sortBy !== 'date') && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterBy !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                    <Filter className="w-3 h-3" />
                    {filterBy === 'active' ? 'Active only' : 'Inactive only'}
                    <button
                      onClick={() => setFilterBy('all')}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortBy !== 'date' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                    <ArrowUpDown className="w-3 h-3" />
                    Sort: {sortBy === 'name' ? 'Name' : 'Size'} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
                    <button
                      onClick={() => { setSortBy('date'); setSortOrder('desc'); }}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
            
            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                disabled={activeDocuments.length === documents.length}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Select All
              </button>
              <button
                onClick={handleSelectFirstOnly}
                disabled={activeDocuments.length === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Select First Only
              </button>
              <span className="text-xs text-gray-400 ml-auto hidden sm:inline">
                ⌘A to select all · Esc to close
              </span>
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
            <>
              {/* Render grouped documents if we have groups */}
              {groupedDocuments.all ? (
                // Simple list for few documents
                <DocumentList 
                  docs={groupedDocuments.all}
                  isDocumentActive={isDocumentActive}
                  handleToggleDocument={handleToggleDocument}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                  formatDate={formatDate}
                  getDocumentSize={getDocumentSize}
                />
              ) : (
                // Grouped list for many documents
                <>
                  {groupedDocuments.today.length > 0 && (
                    <DocumentGroup 
                      title="Today" 
                      docs={groupedDocuments.today}
                      isDocumentActive={isDocumentActive}
                      handleToggleDocument={handleToggleDocument}
                      setShowDeleteConfirm={setShowDeleteConfirm}
                      formatDate={formatDate}
                      getDocumentSize={getDocumentSize}
                    />
                  )}
                  {groupedDocuments.thisWeek.length > 0 && (
                    <DocumentGroup 
                      title="This Week" 
                      docs={groupedDocuments.thisWeek}
                      isDocumentActive={isDocumentActive}
                      handleToggleDocument={handleToggleDocument}
                      setShowDeleteConfirm={setShowDeleteConfirm}
                      formatDate={formatDate}
                      getDocumentSize={getDocumentSize}
                    />
                  )}
                  {groupedDocuments.older.length > 0 && (
                    <DocumentGroup 
                      title="Older" 
                      docs={groupedDocuments.older}
                      isDocumentActive={isDocumentActive}
                      handleToggleDocument={handleToggleDocument}
                      setShowDeleteConfirm={setShowDeleteConfirm}
                      formatDate={formatDate}
                      getDocumentSize={getDocumentSize}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 fixed-bottom-safe">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {pendingSelections?.length > 0 ? (
                <span className="text-blue-600 font-medium">
                  {pendingSelections?.length} selected for study
                </span>
              ) : (
                <span className="text-amber-600 font-medium">
                  Select at least one document
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDone}
                disabled={pendingSelections.length === 0}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
