# PageRush AI

AI-assisted study workspace for turning PDFs into flashcards, quizzes, exams, and adaptive study plans powered by Google Gemini. Built with Next.js 16 (App Router + `pages/api`), React 19, and Zustand for client-side state.

## What it does
- PDF upload + server-side text extraction (`/api/extract-text` using `formidable` + `pdf-parse`, 50MB/file limit).
- Study tools: Smart Study (study guide), flashcards, quiz and exam generation + grading, focus mode, onboarding guide, history replay.
- Exam Cram/adaptive learning: topic breakdowns, readiness assessments, practice questions, cached question banks, and token/cost metrics tracking.
- Client-only Gemini key entry (stored in `localStorage`), progress/history/document caching, and basic PWA metadata (`manifest.json`, mobile-friendly layout).

## Project structure (high level)
- `src/app`: Next.js app router pages, layout, global styles.
- `src/pages/api`: Serverless routes for Gemini prompts, quiz/exam grading, topic content, focus mode, question banks, and PDF extraction.
- `src/components`: UI + feature modules (upload modals, SmartStudy, Quiz/Exam, onboarding, notifications, metrics).
- `src/stores`: Zustand stores for study state, documents, metrics, notifications, and UI flags.
- `src/lib/api`: Centralized client + Gemini API wrapper with model selection, pricing, and metrics hooks.
- `src/utils`: Parsing helpers and adaptive learning utilities (question bank manager, topic content caching).
- `ADAPTIVE_LEARNING_OPTIMIZATION.md`: Notes on caching/question-bank strategy and performance gains.

## Prerequisites
- Node.js 18.18+ (Next.js 16 requirement)
- npm 9+
- A Google Gemini API key (user-provided at runtime; not stored server-side)

## Run locally
```bash
npm install
npm run dev        # starts Next.js with Turbopack on 0.0.0.0:3000
```
Then open `http://localhost:3000`, upload a PDF, and enter your Gemini API key in the UI.

## Environment / configuration
- No required `.env` for local dev; Gemini key is entered in-app and kept in `localStorage`.
- Optional: If you need a different Gemini base URL, configure it in `src/lib/api/gemini.ts` or `src/lib/gemini-config.js` (defaults to `https://generativelanguage.googleapis.com`).
- Vercel config: `vercel.json` sets CORS headers for `/api/extract-text` and allows long-running PDF parses (200s function limit).

## Key behaviors
- Uploads: PDFs are parsed server-side; text is merged and returned. Temporary files are cleaned post-parse; unsupported files are rejected.
- Generation: All study flows call Gemini via `/api/gemini-generate` and specialized endpoints (exam cram, focus mode, question bank).
- Grading: Quiz/exam grading uses `/api/grade-quiz`; MCQ grading for cached banks can happen client-side per `questionBankManager`.
- State: Documents, history, performance summaries, and the Gemini key are persisted in `localStorage`; onboarding includes migration of legacy keys/history.
- Metrics: Token usage and estimated cost are computed client-side from Gemini usage metadata (`setMetricsCallback` in `src/lib/api/gemini.ts`).

## Useful scripts
- `npm run dev` — local development (Turbopack)
- `npm run build` — production build
- `npm run start` — start built app
- `npm run lint` — Next.js ESLint
*(No automated test script is configured; component/unit tests exist in `src/components/**` and `src/utils/**`.)*

## Deployment notes
- Designed for Vercel. Serverless routes rely on Node APIs (e.g., `formidable`, `fs`) allowed in Vercel functions.
- Ensure build target Node ≥18.18.
- If hosting elsewhere, keep the CORS headers from `next.config.ts`/`vercel.json` for `/api/extract-text`.

## Privacy & security
- Gemini API key is never sent to your servers beyond the user’s requests; it is stored locally in the browser.
- Uploaded PDFs are processed server-side only to extract text for the active session; temporary files are removed after parsing.
- No analytics/telemetry beyond optional metrics derived from Gemini responses shown to the user.

## Resources
- Adaptive learning design: `ADAPTIVE_LEARNING_OPTIMIZATION.md`
- Icons/assets/PWA: `public/`
- Questions or issues: open a GitHub issue or email `hong@polytera.dev` .
