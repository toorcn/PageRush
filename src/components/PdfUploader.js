'use client';
import React, { useRef, useState } from 'react';

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
    const formData = new FormData();
    files.forEach(file => formData.append('pdfs', file));
    
    try {
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.text) onExtracted(data.text);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📄 Upload Your Study Materials</h2>
        <p className="text-gray-600">Upload one or more PDF files to get started</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
      >
        <div className="text-4xl mb-4">📁</div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-gray-500 mb-4">or click to browse files</p>
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
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Remove file"
                >
                  ✕
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
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2">⏳</span>
              Processing PDFs...
            </span>
          ) : (
            'Extract Text & Continue'
          )}
        </button>
      )}
    </div>
  );
} 