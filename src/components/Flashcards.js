'use client';
import React, { useState, useEffect } from 'react';

export default function Flashcards({ cards, onRegenerate }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showList, setShowList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Extract topics from cards
  const extractTopics = () => {
    const topics = new Set();
    cards.forEach(card => {
      if (card.topic) {
        topics.add(card.topic);
      }
    });
    return Array.from(topics).sort();
  };

  const topics = extractTopics();
  
  // Filter cards based on selected topic and search term
  const filteredCards = cards.filter(card => {
    const matchesTopic = selectedTopic === 'all' || card.topic === selectedTopic;
    const matchesSearch = !searchTerm || 
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  const card = filteredCards[index] || cards[index];
  
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
      if (showList) return; // Disable keyboard navigation in list view
      
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setIndex(i => Math.min(filteredCards.length - 1, i + 1));
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
  }, [filteredCards.length, showList]);

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🃏 Flashcards</h2>
        <p className="text-gray-600">Click to flip, use arrow keys to navigate</p>
        
        {/* Topic Filter */}
        {topics.length > 0 && (
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Topic:</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setIndex(0);
                setFlipped(false);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Topics ({cards.length})</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic} ({cards.filter(card => card.topic === topic).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setShowList(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showList ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🃏 Card View
          </button>
          <button
            onClick={() => setShowList(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showList ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 List View
          </button>
        </div>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Regenerate Flashcards
          </button>
        )}
      </div>

      {/* Search Bar for List View */}
      {showList && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Progress Bar */}
      {!showList && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / filteredCards.length) * 100}%` }}
            />
          </div>

          {/* Card Counter */}
          <div className="text-center text-sm text-gray-600">
            Card {index + 1} of {filteredCards.length} {filteredCards.length !== cards.length && `(filtered from ${cards.length})`}
          </div>
        </>
      )}

      {/* List View */}
      {showList ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No flashcards match your search criteria</p>
            </div>
          ) : (
            filteredCards.map((card, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 mb-1">
                      Card {idx + 1}
                    </div>
                    {card.topic && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                        {card.topic}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-sm text-gray-700 mb-1">Question:</div>
                    <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded">
                      {card.question}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-700 mb-1">Answer:</div>
                    <div className="text-sm text-gray-800 bg-green-50 p-3 rounded">
                      {card.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Flashcard */
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
      )}

      {/* Navigation Controls - Only show in card view */}
      {!showList && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={index === 0}
            className="px-4 lg:px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={() => { setIndex(i => Math.min(filteredCards.length - 1, i + 1)); setFlipped(false); }}
            disabled={index === filteredCards.length - 1}
            className="px-4 lg:px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next card"
          >
            Next →
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {!showList && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">
            💡 <strong>Keyboard shortcuts:</strong> Space to flip, ←/→ to navigate
          </p>
        </div>
      )}
    </div>
  );
} 