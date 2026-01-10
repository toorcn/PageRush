'use client';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';

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
    <div className="space-y-4 lg:space-y-6">
      <div className="space-y-3 lg:space-y-4">
        <label className="block">
          <span className="text-sm lg:text-base font-medium text-gray-700 mb-2 block">API Key</span>
          <div className="relative group">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={handleChange}
              className={`w-full px-4 py-3 lg:py-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base lg:text-lg ${
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </label>

        {/* Validation Feedback */}
        {isValid === true && (
          <div className="flex items-center text-green-600 text-sm lg:text-base bg-green-50/50 p-3 lg:p-4 rounded-lg border border-green-200">
            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span>API key looks valid</span>
          </div>
        )}
        {isValid === false && (
          <div className="flex items-center text-red-600 text-sm lg:text-base bg-red-50/50 p-3 lg:p-4 rounded-lg border border-red-200">
            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span>Please enter a valid API key</span>
          </div>
        )}

        {/* Help Text */}
        <div id="key-help" className="text-sm lg:text-base text-gray-600 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 lg:p-5 rounded-lg border border-blue-200/50">
          <p className="font-medium mb-3 lg:mb-4 text-gray-800">How to get your Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-2 lg:space-y-3 text-sm lg:text-base">
            <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Google AI Studio</a></li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API Key"</li>
            <li>Copy the generated key and paste it above</li>
          </ol>
          <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-white/50 rounded border border-gray-200">
            <p className="text-xs lg:text-sm text-gray-500 flex items-start">
              <Lock className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>Your API key is never stored on our servers and is only used to make requests to Gemini.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 