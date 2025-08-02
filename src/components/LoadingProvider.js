import React, { createContext, useContext, useState, useCallback } from 'react';
import FullPageLoader from './FullPageLoader';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingText, setGlobalLoadingText] = useState('Loading...');

  const startLoading = useCallback((key = 'global', text = 'Loading...') => {
    if (key === 'global') {
      setGlobalLoading(true);
      setGlobalLoadingText(text);
    } else {
      setLoadingStates(prev => new Map(prev).set(key, { loading: true, text }));
    }
  }, []);

  const stopLoading = useCallback((key = 'global') => {
    if (key === 'global') {
      setGlobalLoading(false);
      setGlobalLoadingText('Loading...');
    } else {
      setLoadingStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  }, []);

  const isLoading = useCallback((key = 'global') => {
    if (key === 'global') {
      return globalLoading;
    }
    return loadingStates.has(key);
  }, [globalLoading, loadingStates]);

  const getLoadingText = useCallback((key = 'global') => {
    if (key === 'global') {
      return globalLoadingText;
    }
    return loadingStates.get(key)?.text || 'Loading...';
  }, [globalLoadingText, loadingStates]);

  const value = {
    startLoading,
    stopLoading,
    isLoading,
    getLoadingText,
    globalLoading,
    globalLoadingText
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading && (
        <FullPageLoader 
          text={globalLoadingText}
          showLogo={true}
        />
      )}
    </LoadingContext.Provider>
  );
}; 