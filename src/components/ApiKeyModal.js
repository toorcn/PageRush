'use client';
import { useState, useEffect, useRef } from 'react';
import { Key, X, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink, ClipboardList, Check } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, onSave, currentKey = '' }) {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const modalRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      setKey(currentKey);
      setShowKey(false);
    }
  }, [isOpen, currentKey]);

  const handleChange = (e) => {
    const value = e.target.value;
    setKey(value);
    if (value.length > 20) {
      setIsValid(true);
    } else if (value.length > 0) {
      setIsValid(false);
    } else {
      setIsValid(null);
    }
  };

  const handleSave = () => {
    if (key.length > 20) {
      onSave(key);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add API Key</h2>
                <p className="text-amber-100 text-sm">Connect to Gemini AI</p>
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={handleChange}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                  isValid === true
                    ? 'border-green-500 bg-green-50/50'
                    : isValid === false
                    ? 'border-red-500 bg-red-50/50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                placeholder="Paste your API key here"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Validation */}
          {isValid === true && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4" />
              <span>API key looks valid</span>
            </div>
          )}
          {isValid === false && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4" />
              <span>Please enter a valid API key</span>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> How to get your API key
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="font-medium text-amber-600">1.</span>
                <span>
                  Go to{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-amber-600">2.</span>
                <span>Sign in with your Google account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-amber-600">3.</span>
                <span>Click "Create API Key"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-amber-600">4.</span>
                <span>Copy and paste it above</span>
              </li>
            </ol>
          </div>

          {/* Security Note */}
          <p className="text-xs text-gray-500 flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <span>🔒</span>
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Save API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact inline version for the floating onboarding card
export function ApiKeyInline({ onSave, currentKey = '' }) {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState(currentKey.length > 20);

  const handleChange = (e) => {
    const value = e.target.value;
    setKey(value);
    setIsValid(value.length > 20);
  };

  const handleSave = () => {
    if (isValid) {
      onSave(key);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={key}
          onChange={handleChange}
          className={`w-full px-3 py-2 pr-10 text-sm border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
            isValid ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'
          }`}
          placeholder="Paste API key here"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={!isValid}
        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
      >
        {isValid ? <><Check className="w-4 h-4" /> Save Key</> : 'Enter Valid Key'}
      </button>
      <a
        href="https://makersuite.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-amber-600 hover:text-amber-700 text-center"
      >
        Get your free API key →
      </a>
    </div>
  );
}
