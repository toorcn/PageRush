'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, List, RefreshCw, ChevronLeft, ChevronRight, RotateCcw, Lightbulb, Search, AlertTriangle } from 'lucide-react';

export default function Flashcards({ cards, onRegenerate }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showList, setShowList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract topics from cards
  const topics = useMemo(() => {
    if (!cards) return [];
    const topicSet = new Set();
    cards.forEach(card => {
      if (card.topic) {
        topicSet.add(card.topic);
      }
    });
    return Array.from(topicSet).sort();
  }, [cards]);
  
  // Filter cards based on selected topic and search term
  const filteredCards = useMemo(() => {
    if (!cards) return [];
    return cards.filter(card => {
      const matchesTopic = selectedTopic === 'all' || card.topic === selectedTopic;
      const matchesSearch = !searchTerm || 
        card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.answer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [cards, selectedTopic, searchTerm]);

  const card = filteredCards[index] || (cards && cards[index]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (showList) return;
    
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
  }, [filteredCards.length, showList]);

  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!cards || !cards.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Flashcards Available</h2>
        <p className="text-gray-500">Try generating flashcards from your study materials</p>
      </div>
    );
  }

  if (!card || typeof card !== 'object' || !card.question || !card.answer) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Flashcard Data</h2>
        <p className="text-gray-500">The flashcard data is not in the correct format</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Flashcards</h2>
        </div>
        <p className="text-gray-500 text-sm">Click to flip, use arrow keys to navigate</p>
        
        {/* Topic Filter */}
        {topics.length > 0 && (
          <div className="mt-4 mb-4">
            <label htmlFor="topic-filter" className="block text-sm font-medium text-gray-600 mb-2">Filter by Topic:</label>
            <select
              id="topic-filter"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setIndex(0);
                setFlipped(false);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            >
              <option value="all">All Topics ({cards.length})</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic} ({cards.filter(c => c.topic === topic).length})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setShowList(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              !showList 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Card View
          </button>
          <button
            onClick={() => setShowList(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              showList 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      {/* Search Bar for List View */}
      {showList && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm"
          />
        </div>
      )}

      {/* Progress Bar */}
      {!showList && (
        <>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / filteredCards.length) * 100}%` }}
            />
          </div>
          <div className="text-center text-sm text-gray-500">
            Card {index + 1} of {filteredCards.length} {filteredCards.length !== cards.length && `(filtered from ${cards.length})`}
          </div>
        </>
      )}

      {/* List View */}
      {showList ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCards.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No flashcards match your search criteria</p>
            </div>
          ) : (
            filteredCards.map((c, idx) => (
              <div key={`card-${idx}`} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 text-sm mb-1">
                      Card {idx + 1}
                    </div>
                    {c.topic && (
                      <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block mb-2">
                        {c.topic}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-xs text-gray-500 mb-1 uppercase tracking-wide">Question</div>
                    <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {c.question}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-xs text-gray-500 mb-1 uppercase tracking-wide">Answer</div>
                    <div className="text-sm text-gray-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      {c.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Flashcard */
        <div className="flex justify-center px-4 sm:px-0">
          <button
            type="button"
            className="relative w-full max-w-sm h-56 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl"
            onClick={() => setFlipped(f => !f)}
            aria-label={`Flashcard ${index + 1}, click to flip`}
            style={{ perspective: '1000px' }}
          >
            <div
              className="w-full h-full transition-transform duration-500"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of card */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 flex items-center justify-center text-center shadow-sm"
                style={{ 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="text-lg font-medium text-indigo-900">
                  {card?.question || 'Question not available'}
                </div>
              </div>
              {/* Back of card (answer) */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 flex items-center justify-center text-center shadow-sm"
                style={{ 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden', 
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-lg font-medium text-emerald-900">
                  {card?.answer || 'Answer not available'}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      {!showList && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 px-4 sm:px-0">
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
              disabled={index === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={() => { setIndex(i => Math.min(filteredCards.length - 1, i + 1)); setFlipped(false); }}
              disabled={index === filteredCards.length - 1}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next card"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setFlipped(f => !f)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-md"
            aria-label="Flip card"
          >
            <RotateCcw className="w-4 h-4" />
            {flipped ? 'Show Question' : 'Show Answer'}
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {!showList && (
        <div className="hidden sm:flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-3 text-gray-500 text-sm">
          <Lightbulb className="w-4 h-4" />
          <span><strong>Keyboard:</strong> Space to flip, ←/→ to navigate</span>
        </div>
      )}
    </div>
  );
}
