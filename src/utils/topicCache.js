// Topic caching utility for storing and retrieving extracted topics
// Uses document content hash to identify unique documents

// Generate a simple hash for the document content
const generateContentHash = (text) => {
  let hash = 0;
  if (text.length === 0) return hash.toString();
  
  // Simple hash function
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString();
};

// Cache key for localStorage
const getCacheKey = (contentHash, componentType) => {
  return `topics_${componentType}_${contentHash}`;
};

// Save topics to localStorage
export const saveTopicsToCache = (text, topics, componentType) => {
  try {
    const contentHash = generateContentHash(text);
    const cacheKey = getCacheKey(contentHash, componentType);
    const cacheData = {
      topics,
      timestamp: Date.now(),
      contentHash,
      textLength: text.length
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`Topics cached for ${componentType} with hash: ${contentHash}`);
    return contentHash;
  } catch (error) {
    console.error('Error saving topics to cache:', error);
    return null;
  }
};

// Retrieve topics from localStorage
export const getTopicsFromCache = (text, componentType) => {
  try {
    const contentHash = generateContentHash(text);
    const cacheKey = getCacheKey(contentHash, componentType);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      console.log(`No cached topics found for ${componentType} with hash: ${contentHash}`);
      return null;
    }
    
    const parsedData = JSON.parse(cachedData);
    
    // Verify the content hash matches (extra safety check)
    if (parsedData.contentHash !== contentHash) {
      console.log('Content hash mismatch, ignoring cached data');
      return null;
    }
    
    // Check if cache is not too old (7 days)
    const cacheAge = Date.now() - parsedData.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    if (cacheAge > maxAge) {
      console.log('Cached topics are too old, removing from cache');
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`Retrieved cached topics for ${componentType} with hash: ${contentHash}`);
    return parsedData.topics;
  } catch (error) {
    console.error('Error retrieving topics from cache:', error);
    return null;
  }
};

// Clear all topic caches (useful for debugging or manual reset)
export const clearTopicCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const topicKeys = keys.filter(key => key.startsWith('topics_'));
    topicKeys.forEach(key => localStorage.removeItem(key));
    console.log('All topic caches cleared');
  } catch (error) {
    console.error('Error clearing topic cache:', error);
  }
};

// Get cache statistics
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const topicKeys = keys.filter(key => key.startsWith('topics_'));
    const stats = {
      totalCached: topicKeys.length,
      examCached: 0,
      quizCached: 0,
      totalSize: 0
    };
    
    topicKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (key.includes('exam')) stats.examCached++;
        if (key.includes('quiz')) stats.quizCached++;
        stats.totalSize += JSON.stringify(data).length;
      } catch (e) {
        // Ignore invalid cache entries
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}; 