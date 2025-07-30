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
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔑 Enter Your Gemini API Key</h2>
        <p className="text-gray-600">Your API key is required to generate study materials</p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">API Key</span>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                isValid === true ? 'border-green-500 bg-green-50' : 
                isValid === false ? 'border-red-500 bg-red-50' : 
                'border-gray-300'
              }`}
              placeholder="Paste your Gemini API key here"
              aria-describedby="key-help"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </label>

        {/* Validation Feedback */}
        {isValid === true && (
          <div className="flex items-center text-green-600 text-sm">
            <span className="mr-2">✅</span>
            API key looks valid
          </div>
        )}
        {isValid === false && (
          <div className="flex items-center text-red-600 text-sm">
            <span className="mr-2">⚠️</span>
            Please enter a valid API key
          </div>
        )}

        {/* Help Text */}
        <div id="key-help" className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">How to get your Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API Key"</li>
            <li>Copy the generated key and paste it above</li>
          </ol>
          <p className="mt-2 text-xs text-gray-400">
            🔒 Your API key is never stored on our servers and is only used to make requests to Gemini.
          </p>
        </div>
      </div>
    </div>
  );
} 