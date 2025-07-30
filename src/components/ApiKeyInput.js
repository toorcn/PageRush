'use client';
import React, { useState } from 'react';

export default function ApiKeyInput({ onChange }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setKey(value);
    onChange(value);
    
    // Basic validation (Gemini API keys are typically long)
    if (value.length > 20) {
      setIsValid(true);
    } else if (value.length > 0) {
      setIsValid(false);
    } else {
      setIsValid(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">API Key</span>
          <div className="relative group">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isValid === true ? 'border-green-500 bg-green-50/50' : 
                isValid === false ? 'border-red-500 bg-red-50/50' : 
                'border-gray-300 bg-white/50 group-hover:border-gray-400'
              }`}
              placeholder="Paste your Gemini API key here"
              aria-describedby="key-help"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </label>

        {/* Validation Feedback */}
        {isValid === true && (
          <div className="flex items-center text-green-600 text-sm bg-green-50/50 p-3 rounded-lg border border-green-200">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">✓</span>
            </div>
            API key looks valid
          </div>
        )}
        {isValid === false && (
          <div className="flex items-center text-red-600 text-sm bg-red-50/50 p-3 rounded-lg border border-red-200">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs">!</span>
            </div>
            Please enter a valid API key
          </div>
        )}

        {/* Help Text */}
        <div id="key-help" className="text-sm text-gray-600 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-blue-200/50">
          <p className="font-medium mb-3 text-gray-800">How to get your Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Google AI Studio</a></li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API Key"</li>
            <li>Copy the generated key and paste it above</li>
          </ol>
          <div className="mt-3 p-3 bg-white/50 rounded border border-gray-200">
            <p className="text-xs text-gray-500 flex items-center">
              <span className="mr-2">🔒</span>
              Your API key is never stored on our servers and is only used to make requests to Gemini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 