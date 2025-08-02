# Adaptive Learning Optimization

## Overview

The adaptive learning system has been optimized to significantly reduce API calls and improve user experience by implementing a pre-generated question bank system.

## Key Improvements

### 1. Pre-generated Question Banks
- **Before**: Every question was generated on-demand via Gemini API calls
- **After**: Question banks are generated once per topic and cached locally
- **Result**: 90% reduction in API calls for MCQ questions

### 2. Smart Question Selection
- Questions are selected from pre-generated banks based on:
  - Difficulty level (easy/medium/hard)
  - Question type preference (MCQ vs text)
  - Performance-based adaptive difficulty adjustment

### 3. Local MCQ Grading
- **Before**: All questions required API calls for grading
- **After**: MCQ questions are graded instantly without API calls
- **Result**: Instant feedback for MCQ questions, faster user experience

### 4. Persistent Caching
- Question banks are stored in localStorage
- Cached data persists across browser sessions
- Automatic cache expiration after 7 days

## Architecture

### Question Bank Manager (`src/utils/questionBankManager.js`)
```javascript
// Core functionality
- generateQuestionBank(topic, content, apiKey)
- getNextQuestion(topicId, difficulty, preferMCQ)
- checkMCQAnswer(question, userAnswer) // No API call needed
- getPerformanceAnalytics(topicId)
- getNextDifficulty(topicId)
```

### API Endpoint (`pages/api/generate-question-bank.js`)
- Generates 10-15 questions per topic
- Mix of MCQ (60%) and text questions (40%)
- Varying difficulty levels
- Single API call per topic instead of per question

## User Experience Improvements

### 1. Question Bank Status Dashboard
- Visual indicators showing which topics have loaded question banks
- Remaining question counts
- Preload all question banks option

### 2. Performance Analytics
- Real-time accuracy tracking
- Difficulty breakdown
- Average response times
- Topic-specific performance metrics

### 3. Smart UI Indicators
- ⚡ Instant Feedback badge for MCQ questions
- 🤖 AI Grading badge for text questions
- Difficulty and question type indicators
- Loading states for question bank generation

## Performance Benefits

### API Call Reduction
- **Before**: 2 API calls per question (generate + grade)
- **After**: 
  - MCQ questions: 0 API calls (instant grading)
  - Text questions: 1 API call (only for grading)
  - Initial setup: 1 API call per topic for question bank

### Speed Improvements
- MCQ questions: Instant feedback (was ~2-3 seconds)
- Text questions: Only grading delay (was ~4-6 seconds total)
- Question loading: Instant from cache (was ~2-3 seconds)

### Cost Reduction
- Estimated 85-90% reduction in API costs
- Reduced server load
- Better user experience with faster responses

## Usage

### For Users
1. **First Time**: Question banks are generated when you start practicing a topic
2. **Subsequent Sessions**: Question banks load instantly from cache
3. **MCQ Questions**: Get instant feedback without waiting
4. **Text Questions**: Still use AI grading for detailed feedback

### For Developers
```javascript
// Initialize question bank for a topic
await questionBankManager.getQuestionBank(topic, content, apiKey);

// Get next question
const question = questionBankManager.getNextQuestion(topicId, 'medium', true);

// Grade MCQ locally (no API call)
const result = questionBankManager.checkMCQAnswer(question, userAnswer);

// Get performance analytics
const analytics = questionBankManager.getPerformanceAnalytics(topicId);
```

## Configuration

### Question Bank Settings
- **Questions per topic**: 10-15 (configurable)
- **MCQ ratio**: 60% (configurable)
- **Difficulty distribution**: 40% easy, 40% medium, 20% hard
- **Cache duration**: 7 days

### Adaptive Difficulty
- **High performance** (≥80% accuracy): Move to harder questions
- **Medium performance** (60-79% accuracy): Stay at current difficulty
- **Low performance** (<60% accuracy): Move to easier questions

## Future Enhancements

1. **Offline Support**: Full offline functionality for MCQ questions
2. **Question Variety**: More question types and formats
3. **Spaced Repetition**: Intelligent question scheduling
4. **Collaborative Learning**: Share question banks between users
5. **Advanced Analytics**: Detailed learning insights and recommendations

## Testing

Run the test suite to verify functionality:
```javascript
// In browser console
testQuestionBankManager();
```

This will test:
- MCQ answer checking
- Performance analytics
- Difficulty calculation
- Question selection logic 