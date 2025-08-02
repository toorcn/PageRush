// Question Bank Manager for Adaptive Learning
class QuestionBankManager {
  constructor() {
    this.questionBanks = new Map(); // topicId -> questionBank
    this.usedQuestions = new Map(); // topicId -> Set of used question IDs
    this.questionHistory = new Map(); // topicId -> Array of question history
  }

  // Generate question bank for a topic
  async generateQuestionBank(topic, content, apiKey) {
    try {
      const response = await fetch('/api/generate-question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          content,
          geminiApiKey: apiKey
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const questionBank = data.questionBank || [];

      // Store the question bank
      this.questionBanks.set(topic.id, questionBank);
      this.usedQuestions.set(topic.id, new Set());
      this.questionHistory.set(topic.id, []);

      // Store in localStorage for persistence
      this.saveToLocalStorage(topic.id, questionBank);

      return questionBank;
    } catch (error) {
      console.error('Error generating question bank:', error);
      throw error;
    }
  }

  // Get question bank for a topic (from cache or generate)
  async getQuestionBank(topic, content, apiKey) {
    // Check if we have a cached question bank
    let questionBank = this.questionBanks.get(topic.id);
    
    if (!questionBank) {
      // Try to load from localStorage
      questionBank = this.loadFromLocalStorage(topic.id);
      if (questionBank) {
        this.questionBanks.set(topic.id, questionBank);
        this.usedQuestions.set(topic.id, new Set());
        this.questionHistory.set(topic.id, []);
      }
    }

    // If still no question bank, generate one
    if (!questionBank) {
      questionBank = await this.generateQuestionBank(topic, content, apiKey);
    }

    return questionBank;
  }

  // Get next question based on difficulty and type preferences
  getNextQuestion(topicId, difficulty = 'medium', preferMCQ = true) {
    const questionBank = this.questionBanks.get(topicId);
    const usedQuestions = this.usedQuestions.get(topicId) || new Set();

    if (!questionBank) {
      return null;
    }

    // Filter available questions by difficulty
    const availableQuestions = questionBank.filter(q => 
      !usedQuestions.has(q.id) && q.difficulty === difficulty
    );

    if (availableQuestions.length === 0) {
      // If no questions available for this difficulty, try any unused question
      const anyAvailable = questionBank.filter(q => !usedQuestions.has(q.id));
      if (anyAvailable.length === 0) {
        // All questions used, reset used questions for this topic
        this.usedQuestions.set(topicId, new Set());
        return this.getNextQuestion(topicId, difficulty, preferMCQ);
      }
      return anyAvailable[Math.floor(Math.random() * anyAvailable.length)];
    }

    // If preferMCQ is true, prioritize MCQ questions
    if (preferMCQ) {
      const mcqQuestions = availableQuestions.filter(q => q.type === 'mcq');
      if (mcqQuestions.length > 0) {
        return mcqQuestions[Math.floor(Math.random() * mcqQuestions.length)];
      }
    }

    // Return random available question
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }

  // Mark question as used
  markQuestionUsed(topicId, questionId) {
    const usedQuestions = this.usedQuestions.get(topicId) || new Set();
    usedQuestions.add(questionId);
    this.usedQuestions.set(topicId, usedQuestions);
  }

  // Add question to history
  addToHistory(topicId, question, userAnswer, isCorrect, responseTime) {
    const history = this.questionHistory.get(topicId) || [];
    history.push({
      question,
      userAnswer,
      isCorrect,
      responseTime,
      timestamp: new Date().toISOString()
    });
    this.questionHistory.set(topicId, history);
  }

  // Get question history for a topic
  getHistory(topicId) {
    return this.questionHistory.get(topicId) || [];
  }

  // Get performance analytics for a topic
  getPerformanceAnalytics(topicId) {
    const history = this.getHistory(topicId);
    if (history.length === 0) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 0,
        difficultyBreakdown: {}
      };
    }

    const totalQuestions = history.length;
    const correctAnswers = history.filter(h => h.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const averageTime = history.reduce((sum, h) => sum + h.responseTime, 0) / totalQuestions;

    // Difficulty breakdown
    const difficultyBreakdown = {};
    history.forEach(h => {
      const difficulty = h.question.difficulty;
      if (!difficultyBreakdown[difficulty]) {
        difficultyBreakdown[difficulty] = { total: 0, correct: 0 };
      }
      difficultyBreakdown[difficulty].total++;
      if (h.isCorrect) {
        difficultyBreakdown[difficulty].correct++;
      }
    });

    return {
      totalQuestions,
      correctAnswers,
      accuracy,
      averageTime,
      difficultyBreakdown
    };
  }

  // Determine next difficulty based on performance
  getNextDifficulty(topicId) {
    const analytics = this.getPerformanceAnalytics(topicId);
    const recentHistory = this.getHistory(topicId).slice(-5); // Last 5 questions

    if (recentHistory.length < 3) {
      return 'medium'; // Default to medium if not enough history
    }

    const recentCorrect = recentHistory.filter(h => h.isCorrect).length;
    const recentAccuracy = (recentCorrect / recentHistory.length) * 100;

    if (recentAccuracy >= 80) {
      return 'hard';
    } else if (recentAccuracy >= 60) {
      return 'medium';
    } else {
      return 'easy';
    }
  }

  // Check if MCQ question is correct (no API call needed)
  checkMCQAnswer(question, userAnswer) {
    if (question.type !== 'mcq') {
      throw new Error('Question is not MCQ type');
    }
    
    const isCorrect = userAnswer === question.correctAnswer;
    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      score: isCorrect ? 1.0 : 0.0
    };
  }

  // Save question bank to localStorage
  saveToLocalStorage(topicId, questionBank) {
    try {
      const key = `questionBank_${topicId}`;
      localStorage.setItem(key, JSON.stringify({
        questionBank,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving question bank to localStorage:', error);
    }
  }

  // Load question bank from localStorage
  loadFromLocalStorage(topicId) {
    try {
      const key = `questionBank_${topicId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Check if data is not too old (7 days)
        const age = Date.now() - parsed.timestamp;
        if (age < 7 * 24 * 60 * 60 * 1000) {
          return parsed.questionBank;
        }
      }
    } catch (error) {
      console.error('Error loading question bank from localStorage:', error);
    }
    return null;
  }

  // Clear all cached data
  clearCache() {
    this.questionBanks.clear();
    this.usedQuestions.clear();
    this.questionHistory.clear();
    
    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('questionBank_')) {
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
    this.questionBanks.forEach((bank, topicId) => {
      const usedQuestions = this.usedQuestions.get(topicId) || new Set();
      status[topicId] = {
        totalQuestions: bank.length,
        usedQuestions: usedQuestions.size,
        remainingQuestions: bank.length - usedQuestions.size
      };
    });
    return status;
  }
}

// Export singleton instance
export const questionBankManager = new QuestionBankManager(); 