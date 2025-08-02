'use client';
import React, { useState, useEffect } from 'react';

export default function Flashcards({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Debug logging
  console.log('Flashcards component received:', { cards, cardsLength: cards?.length, cardsType: typeof cards });
  if (cards && cards.length > 0) {
    console.log('First card structure:', cards[0]);
  }

  if (!cards || !cards.length) {
    console.log('No cards available, showing empty state');
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-4">🃏</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Flashcards Available</h2>
        <p className="text-gray-600">Try generating flashcards from your study materials</p>
        <div className="mt-4 text-xs text-gray-500">
          Debug: cards = {JSON.stringify(cards)}
        </div>
      </div>
    );
  }
  console.log({cards})

  const card = cards[index];
  
  // Validate card structure
  if (!card || typeof card !== 'object' || !card.question || !card.answer) {
    console.error('Invalid card structure:', card);
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Flashcard Data</h2>
        <p className="text-gray-600">The flashcard data is not in the correct format</p>
        <div className="mt-4 text-xs text-gray-500">
          Debug: card = {JSON.stringify(card)}
        </div>
      </div>
    );
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setIndex(i => Math.min(cards.length - 1, i + 1));
          setFlipped(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setIndex(i => Math.max(0, i - 1));
          setFlipped(false);
          break;
        case ' ':
          e.preventDefault();
          setFlipped(f => !f);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length]);

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🃏 Flashcards</h2>
        <p className="text-gray-600">Click to flip, use arrow keys to navigate</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card Counter */}
      <div className="text-center text-sm text-gray-600">
        Card {index + 1} of {cards.length}
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div
          className="relative w-80 h-48 cursor-pointer"
          onClick={() => setFlipped(f => !f)}
          tabIndex={0}
          role="button"
          aria-label={`Flashcard ${index + 1}, click to flip`}
          style={{ perspective: '1000px' }}
        >
          <div
            className={`w-full h-full transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%', 
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front of card */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 flex items-center justify-center text-center"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden', 
                zIndex: 2, 
                transform: 'rotateY(0deg)',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <div className="text-lg font-medium text-blue-900">
                {card?.question || 'Question not available'}
              </div>
            </div>
            {/* Back of card (answer) */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 flex items-center justify-center text-center"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)', 
                zIndex: 3,
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <div className="text-lg font-medium text-green-900">
                {card?.answer || 'Answer not available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={index === 0}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous card"
        >
          ← Previous
        </button>

        <button
          onClick={() => setFlipped(f => !f)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          aria-label="Flip card"
        >
          {flipped ? 'Show Question' : 'Show Answer'}
        </button>

        <button
          onClick={() => { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
          disabled={index === cards.length - 1}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next card"
        >
          Next →
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">
          💡 <strong>Keyboard shortcuts:</strong> Space to flip, ←/→ to navigate
        </p>
      </div>
    </div>
  );
} 