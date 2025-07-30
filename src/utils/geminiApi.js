// Gemini API utility: prevents repeated calls for the same input within a short period
// Usage: import { callGeminiApi } from './geminiApi';
// await callGeminiApi({ text, promptType, geminiApiKey, topics, questionCount })

const CACHE_DURATION_MS = 60 * 1000; // 1 minute cooldown
const cache = new Map(); // key: hash, value: { result, timestamp }
const inFlight = new Map(); // key: hash, value: Promise

function hashInput({ text, promptType, geminiApiKey, topics, questionCount }) {
  // Simple hash: JSON string of sorted keys (excluding API key for privacy)
  return JSON.stringify({
    text,
    promptType,
    topics,
    questionCount,
  });
}

export async function callGeminiApi({ text, promptType, geminiApiKey, topics, questionCount }) {
  const key = hashInput({ text, promptType, topics, questionCount });
  const now = Date.now();

  // Check cache
  if (cache.has(key)) {
    const { result, timestamp } = cache.get(key);
    if (now - timestamp < CACHE_DURATION_MS) {
      return result;
    } else {
      cache.delete(key);
    }
  }

  // Check in-flight
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  // Make the API call
  const fetchPromise = fetch('/api/gemini-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, promptType, geminiApiKey, topics, questionCount }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      cache.set(key, { result: data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, fetchPromise);
  return fetchPromise;
} 