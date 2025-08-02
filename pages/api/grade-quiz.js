export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAnswers, quiz, geminiApiKey } = req.body;

  if (!userAnswers || !quiz || !geminiApiKey) {
    console.error('API Grade-quiz: Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let totalScore = 0;
    let totalPoints = 0;
    const detailedFeedback = [];

    for (let i = 0; i < quiz.length; i++) {
      const question = quiz[i];
      const userAnswer = userAnswers[i] || '';
      const points = question.points || 1;
      totalPoints += points;

      if (question.type === 'mcq') {
        // MCQ: Simple exact match
        const isCorrect = userAnswer === question.answer;
        totalScore += isCorrect ? points : 0;
        detailedFeedback.push({
          questionIndex: i,
          question: question.question,
          userAnswer,
          correctAnswer: question.answer,
          isCorrect,
          points: isCorrect ? points : 0,
          maxPoints: points,
          feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.answer}`,
          explanation: question.explanation || ''
        });
      } else {
        // Open-ended questions: Use Gemini for assessment
        const assessmentPrompt = `Assess the following student answer for an exam question.

Question: ${question.question}
Question Type: ${question.type}
Expected Answer: ${question.answer}
Assessment Criteria: ${question.explanation || 'Evaluate based on accuracy, completeness, and relevance'}

Student Answer: ${userAnswer}

Please provide:
1. A score out of ${points} points
2. Brief feedback on what was good and what could be improved
3. Specific suggestions for improvement

Return ONLY a JSON object with this exact structure:
{
  "score": <number between 0 and ${points}>,
  "feedback": "<brief feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Example:
{
  "score": 2,
  "feedback": "Good understanding of the concept, but missing key details about the process.",
  "suggestions": [
    "Include more specific examples",
    "Explain the underlying mechanism",
    "Connect to related concepts"
  ]
}`;

        const assessmentResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: assessmentPrompt }] }]
          }),
        });

        if (!assessmentResponse.ok) {
          throw new Error(`Gemini assessment API error: ${assessmentResponse.status}`);
        }

        const assessmentData = await assessmentResponse.json();
        let assessmentText = assessmentData.candidates[0].content.parts[0].text;

        // clean of ```json and ```
        assessmentText = assessmentText.replace(/```json/g, '').replace(/```/g, '');

        let assessment;
        try {
          assessment = JSON.parse(assessmentText);
        } catch (error) {
          console.error('Failed to parse assessment JSON:', assessmentText);
          // Fallback assessment
          assessment = {
            score: 0,
            feedback: 'Unable to assess answer automatically.',
            suggestions: ['Please review the question and expected answer carefully.']
          };
        }

        totalScore += assessment.score;
        detailedFeedback.push({
          questionIndex: i,
          question: question.question,
          userAnswer,
          correctAnswer: question.answer,
          isCorrect: assessment.score >= points * 0.8, // 80% threshold for "correct"
          points: assessment.score,
          maxPoints: points,
          feedback: assessment.feedback,
          suggestions: assessment.suggestions,
          explanation: question.explanation || ''
        });
      }
    }

    const finalScore = Math.round((totalScore / totalPoints) * 100);

    res.status(200).json({
      score: totalScore,
      total: totalPoints,
      percentage: finalScore,
      details: detailedFeedback
    });

  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ error: 'Failed to grade exam' });
  }
} 