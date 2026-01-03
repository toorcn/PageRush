'use client';
import { useRef, useState, useCallback } from 'react';
import LottieLoader from './LottieLoader';

// Dynamic import for PDF.js to avoid SSR issues
const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  // Set worker source - use CDN for reliability
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  return pdfjs;
};

export default function PdfUploader({ onExtracted }) {
  const fileInput = useRef();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, pages: 0, totalPages: 0 });

  // Extract text from a single PDF file using PDF.js (client-side)
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
      // Load PDF.js dynamically
      setProcessingStatus('Loading PDF processor...');
      const pdfjs = await loadPdfJs();
      
      // Process each file individually using client-side extraction
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
      setFiles([]); // Clear files after processing
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6" data-upload-area>
      <div className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">📄 Upload Your Study Materials</h2>
        <p className="text-gray-600 text-sm lg:text-base">Upload one or more PDF files to get started</p>
        <p className="text-green-600 text-xs mt-1">✓ PDFs are processed locally in your browser - no file size limits!</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 lg:p-8 text-center transition-colors min-h-[200px] lg:min-h-[250px] flex flex-col items-center justify-center cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-4xl lg:text-5xl mb-4">📁</div>
        <p className="text-base lg:text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-gray-500 text-sm lg:text-base mb-4">or tap to browse files</p>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm lg:text-base"
          onClick={() => fileInput.current?.click()}
        >
          Choose Files
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4 lg:p-6">
          <h3 className="font-semibold text-base lg:text-lg mb-4">Selected Files ({files.length})</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.name + file.size} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-2xl lg:text-3xl flex-shrink-0">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm lg:text-base truncate">{file.name}</p>
                    <p className="text-xs lg:text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(files.indexOf(file))}
                  className="text-red-500 hover:text-red-700 p-2 lg:p-3 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  <span className="text-lg lg:text-xl">✕</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="bg-blue-50 rounded-xl p-4 lg:p-6 border border-blue-200">
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

      {/* Submit Button */}
      {files.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full py-4 lg:py-5 bg-blue-600 text-white rounded-xl font-bold text-base lg:text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <LottieLoader size="small" text="" />
              <span className="ml-2">Processing PDFs...</span>
            </span>
          ) : (
            'Extract Text & Continue'
          )}
        </button>
      )}
    </div>
  );
}
