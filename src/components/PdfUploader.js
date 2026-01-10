'use client';
import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, Loader2, FolderOpen } from 'lucide-react';
import LottieLoader from './LottieLoader';

// Dynamic import for PDF.js to avoid SSR issues
const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  const version = pdfjs.version;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return pdfjs;
};

export default function PdfUploader({ onExtracted }) {
  const fileInput = useRef();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, pages: 0, totalPages: 0 });

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
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
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
            throw new Error(`No text could be extracted from "${file.name}". The PDF might be image-based or protected.`);
          }
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          alert(`Failed to process "${file.name}": ${fileError.message}`);
        }
      }
      
      setProcessingStatus('Complete!');
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

  return (
    <div className="space-y-5" data-upload-area>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Upload className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Upload Study Materials</h2>
        </div>
        <p className="text-gray-500 text-sm">Upload one or more PDF files to get started</p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-emerald-600 text-xs">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>PDFs are processed locally in your browser</span>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <button
        type="button"
        className={`w-full border-2 border-dashed rounded-xl p-6 lg:p-8 text-center transition-all min-h-[200px] lg:min-h-[220px] flex flex-col items-center justify-center cursor-pointer ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-200 bg-gray-50/50 hover:border-indigo-400 hover:bg-indigo-50/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
      >
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
          isDragging ? 'bg-indigo-100' : 'bg-gray-100'
        }`}>
          <FolderOpen className={`w-7 h-7 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} />
        </div>
        <p className="text-base font-medium text-gray-700 mb-1">
          {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-gray-400 text-sm mb-4">or click to browse files</p>
        <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Choose Files
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </button>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
          <h3 className="font-medium text-gray-700 text-sm mb-3">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.name + file.size} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(files.indexOf(file)); }}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
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

      {/* Submit Button */}
      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-medium text-base hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing PDFs...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Extract Text & Continue
            </>
          )}
        </button>
      )}
    </div>
  );
}
