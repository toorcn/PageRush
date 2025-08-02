// Topic Content Manager for caching and preloading topic breakdown content
class TopicContentManager {
  constructor() {
    this.topicContent = new Map(); // topicId -> detailed content
    this.loadingStatus = new Map(); // topicId -> loading status
  }

  // Generate detailed content for a topic
  async generateTopicContent(topic, content, apiKey) {
    try {
      const response = await fetch('/api/exam-cram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTopicContent',
          topic,
          content,
          geminiApiKey: apiKey
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const detailedContent = data.topicContent || {};

      // Store the content
      this.topicContent.set(topic.id, detailedContent);

      // Store in localStorage for persistence
      this.saveToLocalStorage(topic.id, detailedContent);

      return detailedContent;
    } catch (error) {
      console.error('Error generating topic content:', error);
      throw error;
    }
  }

  // Get topic content (from cache or generate)
  async getTopicContent(topic, content, apiKey) {
    // Check if we have cached content
    let detailedContent = this.topicContent.get(topic.id);
    
    if (!detailedContent) {
      // Try to load from localStorage
      detailedContent = this.loadFromLocalStorage(topic.id);
      if (detailedContent) {
        this.topicContent.set(topic.id, detailedContent);
      }
    }

    // If still no content, generate it
    if (!detailedContent) {
      detailedContent = await this.generateTopicContent(topic, content, apiKey);
    }

    return detailedContent;
  }

  // Check if topic content is loaded
  isTopicContentLoaded(topicId) {
    return this.topicContent.has(topicId) || this.loadFromLocalStorage(topicId);
  }

  // Get cached topic content
  getCachedTopicContent(topicId) {
    return this.topicContent.get(topicId) || this.loadFromLocalStorage(topicId);
  }

  // Set loading status for a topic
  setLoadingStatus(topicId, status) {
    this.loadingStatus.set(topicId, status);
  }

  // Get loading status for a topic
  getLoadingStatus(topicId) {
    return this.loadingStatus.get(topicId) || 'idle';
  }

  // Preload content for multiple topics
  async preloadTopicContent(topics, content, apiKey) {
    const promises = topics.map(async (topic) => {
      try {
        this.setLoadingStatus(topic.id, 'loading');
        await this.getTopicContent(topic, content, apiKey);
        this.setLoadingStatus(topic.id, 'loaded');
      } catch (error) {
        console.error(`Error preloading content for topic ${topic.title}:`, error);
        this.setLoadingStatus(topic.id, 'error');
      }
    });

    await Promise.all(promises);
  }

  // Save topic content to localStorage
  saveToLocalStorage(topicId, content) {
    try {
      const key = `topicContent_${topicId}`;
      localStorage.setItem(key, JSON.stringify({
        content,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving topic content to localStorage:', error);
    }
  }

  // Load topic content from localStorage
  loadFromLocalStorage(topicId) {
    try {
      const key = `topicContent_${topicId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Check if data is not too old (30 days)
        const age = Date.now() - parsed.timestamp;
        if (age < 30 * 24 * 60 * 60 * 1000) {
          return parsed.content;
        }
      }
    } catch (error) {
      console.error('Error loading topic content from localStorage:', error);
    }
    return null;
  }

  // Clear all cached data
  clearCache() {
    this.topicContent.clear();
    this.loadingStatus.clear();
    
    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('topicContent_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Get cache status
  getCacheStatus() {
    const status = {};
    this.topicContent.forEach((content, topicId) => {
      status[topicId] = {
        hasContent: true,
        loadingStatus: this.loadingStatus.get(topicId) || 'loaded'
      };
    });
    return status;
  }

  // Get all cached topic IDs
  getCachedTopicIds() {
    return Array.from(this.topicContent.keys());
  }
}

// Export singleton instance
export const topicContentManager = new TopicContentManager(); 