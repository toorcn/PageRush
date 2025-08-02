'use client';
import React, { useRef, useState } from 'react';
import LottieLoader from './LottieLoader';

export default function PdfUploader({ onExtracted }) {
  const fileInput = useRef();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    
    try {
      // Process each file individually
      for (const file of files) {
        // Check file size before upload (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('pdfs', file);
        
        const res = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(`File "${file.name}" is too large for upload. Please try a smaller file.`);
          } else {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(errorData.error || `Upload failed with status ${res.status}`);
          }
        }

        const data = await res.json();
        if (data.text) {
          onExtracted(data.text, file.name);
        } else {
          throw new Error(`No text could be extracted from "${file.name}"`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setFiles([]); // Clear files after processing
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="text-center">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">📄 Upload Your Study Materials</h2>
        <p className="text-gray-600 text-sm lg:text-base">Upload one or more PDF files to get started</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 lg:p-8 text-center transition-colors min-h-[200px] lg:min-h-[250px] flex flex-col items-center justify-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
      >
        <div className="text-4xl lg:text-5xl mb-4">📁</div>
        <p className="text-base lg:text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-gray-500 text-sm lg:text-base mb-4">or tap to browse files</p>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm lg:text-base"
          onClick={(e) => {
            e.stopPropagation();
            fileInput.current?.click();
          }}
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
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-2xl lg:text-3xl flex-shrink-0">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm lg:text-base truncate">{file.name}</p>
                    <p className="text-xs lg:text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-2 lg:p-3 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label="Remove file"
                >
                  <span className="text-lg lg:text-xl">✕</span>
                </button>
              </div>
            ))}
          </div>
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