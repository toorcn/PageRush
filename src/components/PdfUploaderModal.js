'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import LottieLoader from './LottieLoader';

// Dynamic import for PDF.js to avoid SSR issues
const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  // Use unpkg CDN which always has the latest versions
  const version = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
};

/**
 * Modal version of PDF uploader that can be triggered from anywhere in the app
 * Provides a consistent upload experience regardless of where the user is
 */
export default function PdfUploaderModal({ isOpen, onClose, onExtracted }) {
  const fileInput = useRef();
  const modalRef = useRef();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, pages: 0, totalPages: 0 });

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isProcessing, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setIsDragging(false);
      setProcessingStatus('');
      setProgress({ current: 0, total: 0, pages: 0, totalPages: 0 });
    }
  }, [isOpen]);

  const extractTextFromPdf = useCallback(async (file, pdfjs) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setProgress(prev => ({ ...prev, pages: pageNum, totalPages: numPages }));
      setProcessingStatus(`Extracting page ${pageNum} of ${numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  }, []);

  const handleFiles = (fileList) => {
    const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf');
    setFiles(pdfFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length, pages: 0, totalPages: 0 });
    
    try {
      setProcessingStatus('Loading PDF processor...');
      const pdfjs = await loadPdfJs();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(prev => ({ ...prev, current: i + 1 }));
        setProcessingStatus(`Processing "${file.name}"...`);
        
        try {
          const text = await extractTextFromPdf(file, pdfjs);
          
          if (text && text.length > 0) {
            onExtracted(text, file.name);
          } else {
            throw new Error(`No text could be extracted from "${file.name}".`);
          }
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          alert(`Failed to process "${file.name}": ${fileError.message}`);
        }
      }
      
      setProcessingStatus('Complete!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProgress({ current: 0, total: 0, pages: 0, totalPages: 0 });
      setFiles([]);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current && !isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📄</span>
              <div>
                <h2 className="text-lg font-bold">Upload Documents</h2>
                <p className="text-blue-100 text-sm">Add PDF files to study</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/20"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Drag & Drop Area */}
          <div
            role="button"
            tabIndex={0}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInput.current?.click()}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="text-base font-medium text-gray-700 mb-1">
              {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
            </p>
            <p className="text-gray-500 text-sm mb-3">or click to browse</p>
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
              Choose Files
            </span>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <p className="text-green-600 text-xs text-center">
            ✓ PDFs are processed locally in your browser
          </p>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 text-gray-700">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div 
                    key={file.name + file.size} 
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-lg">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">{processingStatus}</span>
                {progress.total > 1 && (
                  <span className="text-sm text-blue-600">File {progress.current} of {progress.total}</span>
                )}
              </div>
              {progress.totalPages > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                    <span>Page progress</span>
                    <span>{progress.pages} / {progress.totalPages}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.pages / progress.totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!files.length || isProcessing}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <LottieLoader size="small" text="" />
                  <span className="ml-2">Processing...</span>
                </span>
              ) : (
                `Upload ${files.length > 0 ? `(${files.length})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
