// Simple test for QuestionBankManager
import { questionBankManager } from './questionBankManager';

// Mock question bank for testing
const mockQuestionBank = [
  {
    id: "q1",
    question: "What is the capital of France?",
    type: "mcq",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswer: "Paris",
    explanation: "Paris is the capital and largest city of France.",
    difficulty: "easy",
    topic: "Geography"
  },
  {
    id: "q2",
    question: "Explain the concept of photosynthesis.",
    type: "text",
    correctAnswer: "Photosynthesis is the process by which plants convert sunlight into energy.",
    explanation: "A good answer should mention light energy conversion and mention plants.",
    difficulty: "medium",
    topic: "Biology"
  },
  {
    id: "q3",
    question: "What is 2 + 2?",
    type: "mcq",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4",
    explanation: "Basic arithmetic: 2 + 2 = 4",
    difficulty: "easy",
    topic: "Math"
  }
];

// Test functions
export function testQuestionBankManager() {
  console.log('🧪 Testing QuestionBankManager...');
  
  // Test 1: MCQ answer checking
  const mcqQuestion = mockQuestionBank[0];
  const mcqResult = questionBankManager.checkMCQAnswer(mcqQuestion, "Paris");
  console.log('✅ MCQ Test:', mcqResult.isCorrect === true ? 'PASS' : 'FAIL');
  
  // Test 2: MCQ wrong answer
  const mcqWrongResult = questionBankManager.checkMCQAnswer(mcqQuestion, "London");
  console.log('✅ MCQ Wrong Answer Test:', mcqWrongResult.isCorrect === false ? 'PASS' : 'FAIL');
  
  // Test 3: Performance analytics
  questionBankManager.addToHistory('test-topic', mcqQuestion, "Paris", true, 5.0);
  questionBankManager.addToHistory('test-topic', mcqQuestion, "London", false, 3.0);
  const analytics = questionBankManager.getPerformanceAnalytics('test-topic');
  console.log('✅ Analytics Test:', analytics.accuracy === 50 ? 'PASS' : 'FAIL');
  
  // Test 4: Next difficulty calculation
  const nextDifficulty = questionBankManager.getNextDifficulty('test-topic');
  console.log('✅ Next Difficulty Test:', nextDifficulty === 'easy' ? 'PASS' : 'FAIL');
  
  console.log('🎉 QuestionBankManager tests completed!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose test function
  window.testQuestionBankManager = testQuestionBankManager;
} 