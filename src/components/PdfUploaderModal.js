'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { FileText, X, FolderOpen, CheckCircle, Loader2 } from 'lucide-react';
import LottieLoader from './LottieLoader';

const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  const version = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
};

export default function PdfUploaderModal({ isOpen, onClose, onExtracted }) {
  const fileInput = useRef();
  const modalRef = useRef();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, pages: 0, totalPages: 0 });

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isProcessing, onClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-indigo-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Upload Documents</h2>
                <p className="text-indigo-200 text-sm">Add PDF files to study</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Drag & Drop Area */}
          <button
            type="button"
            className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
              isDragging ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              <FolderOpen className={`w-6 h-6 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">
              {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
            </p>
            <p className="text-gray-400 text-sm mb-3">or click to browse</p>
            <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
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
          </button>

          <p className="text-emerald-600 text-xs text-center flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            PDFs are processed locally in your browser
          </p>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-medium text-sm mb-3 text-gray-700">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div 
                    key={file.name + file.size} 
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-sm font-medium text-indigo-800">{processingStatus}</span>
                </div>
                {progress.total > 1 && (
                  <span className="text-sm text-indigo-600">File {progress.current} of {progress.total}</span>
                )}
              </div>
              {progress.totalPages > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-indigo-600 mb-1">
                    <span>Page progress</span>
                    <span>{progress.pages} / {progress.totalPages}</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.pages / progress.totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 rounded-b-2xl fixed-bottom-safe">
          <div className="flex gap-3">
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
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
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
