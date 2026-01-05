// ============================================
// CENTRALIZED GEMINI MODEL CONFIGURATION
// ============================================
// Change models here to affect all API routes
// This file is used by server-side API routes

// Available models
export const MODELS = {
  FLASH_PREVIEW: 'gemini-3-flash-preview',
  FLASH: 'gemini-2.5-flash',
  FLASH_LITE: 'gemini-2.5-flash-lite',
};

// Default model
export const DEFAULT_MODEL = MODELS.FLASH_PREVIEW;

// Action-to-model mapping
// Customize which model handles each action type
export const ACTION_MODELS = {
  // Content generation
  'gemini-generate': MODELS.FLASH_PREVIEW,
  'study-guide': MODELS.FLASH_PREVIEW,
  'flashcards': MODELS.FLASH_PREVIEW,
  'quiz': MODELS.FLASH_PREVIEW,
  'lesson': MODELS.FLASH_PREVIEW,
  
  // Quiz grading
  'grade-quiz': MODELS.FLASH_PREVIEW,
  
  // Exam cram features
  'exam-cram': MODELS.FLASH_PREVIEW,
  'generate-topic-content': MODELS.FLASH_PREVIEW,
  
  // Focus mode
  'focus-mode-generate': MODELS.FLASH_PREVIEW,
  
  // Question bank
  'generate-question-bank': MODELS.FLASH_PREVIEW,
};

// Helper to get model for an action
export function getModelForAction(action) {
  return ACTION_MODELS[action] || DEFAULT_MODEL;
}

// API endpoint base URL
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Helper to build the full API URL for a model
export function getApiUrl(action) {
  const model = getModelForAction(action);
  return `${GEMINI_API_BASE}/${model}:generateContent`;
}
