export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAnswers, quiz } = req.body;
  
  if (!userAnswers || !quiz) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (userAnswers[i]?.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        correct++;
      }
    });
    
    res.status(200).json({
      score: correct,
      total: quiz.length,
      percentage: Math.round((correct / quiz.length) * 100)
    });
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({ error: 'Failed to grade quiz' });
  }
} 