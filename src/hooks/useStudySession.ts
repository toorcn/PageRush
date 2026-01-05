'use client';

import { useCallback } from 'react';
import { useDocumentStore, useStudyStore, useNotify } from '@/stores';
import { geminiApi } from '@/lib/api';
import { parseFlashcards, parseQuiz, parseExam } from '@/lib/parsing';
import type { StudyFeature, PerformanceSummary } from '@/types';

const FEATURE_LABELS: Record<StudyFeature, string> = {
  examCram: 'Exam Cram',
  studyGuide: 'Study Guide',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  exam: 'Exam',
  '': 'Study Tools',
};

export function useStudySession() {
  const { getActiveText, activeDocuments } = useDocumentStore();
  const {
    apiKey,
    feature,
    result,
    loading,
    setFeature,
    setResult,
    setLoading,
    setShowQuizGenerator,
    setShowExamGenerator,
    addHistoryItem,
    addPerformanceSummary,
    setQuizScore,
    setExamFeedback,
  } = useStudyStore();
  const notify = useNotify();

  const getFeatureLabel = useCallback((ft: StudyFeature) => FEATURE_LABELS[ft], []);

  const generateContent = useCallback(
    async (
      ft: StudyFeature,
      options?: {
        topics?: string[];
        questionCount?: number;
        knowledgeType?: string;
        questionTypes?: string[];
        performanceSummary?: PerformanceSummary;
      }
    ) => {
      const text = getActiveText();
      if (!text || !apiKey) return;

      setLoading(true, `Generating ${getFeatureLabel(ft)}...`);

      try {
        const data = await geminiApi.generate({
          text,
          promptType: ft,
          apiKey,
          ...options,
        });

        setResult(data);
        setLoading(false);

        // Save to history
        addHistoryItem({
          feature: ft,
          documentName: activeDocuments.map((d) => d.name).join(', '),
          text: text.substring(0, 100) + '...',
          result: data,
          topics: options?.topics,
          questionCount: options?.questionCount,
          knowledgeType: options?.knowledgeType,
          questionTypes: options?.questionTypes,
        });

        notify.success('Content Generated', `Your ${getFeatureLabel(ft)} has been created!`);
      } catch (error) {
        console.error('Generation error:', error);
        setLoading(false);
        notify.error('Generation Failed', 'There was an error generating your content.', {
          label: 'Retry',
          onClick: () => generateContent(ft, options),
        });
      }
    },
    [apiKey, getActiveText, activeDocuments, setLoading, setResult, addHistoryItem, notify, getFeatureLabel]
  );

  const handleFeatureSelect = useCallback(
    async (ft: StudyFeature) => {
      setFeature(ft);
      setResult(null);
      setQuizScore(null);
      setExamFeedback(null);

      if (ft === 'quiz') {
        setShowQuizGenerator(true);
        return;
      }

      if (ft === 'exam') {
        setShowExamGenerator(true);
        return;
      }

      if (ft === 'examCram') {
        // ExamCram handles its own content generation
        return;
      }

      if (!activeDocuments?.length || !apiKey) return;

      await generateContent(ft);
    },
    [apiKey, activeDocuments, setFeature, setResult, setQuizScore, setExamFeedback, setShowQuizGenerator, setShowExamGenerator, generateContent]
  );

  const handleQuizSubmit = useCallback(
    async (answers: Record<number, string> | string[]) => {
      if (!result || !apiKey) return;

      setLoading(true, 'Grading your quiz...');

      try {
        const quizQuestions = parseQuiz(result);
        const data = await geminiApi.gradeQuiz({
          userAnswers: answers,
          quiz: quizQuestions,
          apiKey,
        });

        setQuizScore(data);
        setLoading(false);

        notify.success(
          'Quiz Completed',
          `You scored ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%)`
        );
      } catch (error) {
        console.error('Quiz grading error:', error);
        setLoading(false);
        notify.error('Grading Failed', 'There was an error grading your quiz.');
      }
    },
    [result, apiKey, setLoading, setQuizScore, notify]
  );

  const handleExamSubmit = useCallback(
    async (answers: Record<number, string> | string[]) => {
      if (!result || !apiKey) return;

      setLoading(true, 'Grading your exam...');

      try {
        const examQuestions = parseExam(result);
        const data = await geminiApi.gradeQuiz({
          userAnswers: answers,
          quiz: examQuestions.map((q) => ({
            question: q.question,
            options: q.options || [],
            answer: q.answer,
          })),
          apiKey,
        });

        setQuizScore(data);
        setExamFeedback(data.details || null);
        setLoading(false);

        // Save performance summary
        if (data.details) {
          addPerformanceSummary({
            examId: Date.now(),
            documentName: activeDocuments.map((d) => d.name).join(', '),
            score: data.score,
            total: data.total,
            percentage: data.percentage,
            details: data.details,
            topics: [],
            questionTypes: [],
          });
        }

        notify.success(
          'Exam Completed',
          `You scored ${data.score}/${data.total} (${Math.round((data.score / data.total) * 100)}%)`
        );
      } catch (error) {
        console.error('Exam grading error:', error);
        setLoading(false);
        notify.error('Grading Failed', 'There was an error grading your exam.');
      }
    },
    [result, apiKey, activeDocuments, setLoading, setQuizScore, setExamFeedback, addPerformanceSummary, notify]
  );

  // Get parsed content based on current feature
  const parsedFlashcards = feature === 'flashcards' && result ? parseFlashcards(result) : [];
  const parsedQuiz = feature === 'quiz' && result ? parseQuiz(result) : [];
  const parsedExam = feature === 'exam' && result ? parseExam(result) : [];

  return {
    // State
    feature,
    result,
    loading,
    parsedFlashcards,
    parsedQuiz,
    parsedExam,

    // Actions
    handleFeatureSelect,
    generateContent,
    handleQuizSubmit,
    handleExamSubmit,

    // Helpers
    getFeatureLabel,
  };
}
