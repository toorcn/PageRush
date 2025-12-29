'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function OnboardingTooltip({ 
  children, 
  content, 
  position = 'top',
  show = false,
  onDismiss,
  id
}) {
  const [isVisible, setIsVisible] = useState(show);
  const [dismissed, setDismissed] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    // Check if this tooltip was dismissed before
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]');
    if (dismissedTooltips.includes(id)) {
      setDismissed(true);
      setIsVisible(false);
      return;
    }

    setIsVisible(show);
  }, [show, id]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    // Save dismissed state
    const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]');
    if (!dismissedTooltips.includes(id)) {
      dismissedTooltips.push(id);
      localStorage.setItem('dismissedTooltips', JSON.stringify(dismissedTooltips));
    }
    if (onDismiss) onDismiss();
  };

  if (dismissed || !isVisible) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      {children}
      <div 
        ref={tooltipRef}
        className={`absolute z-50 ${positionClasses[position]} animate-fadeIn`}
      >
        <div className="bg-gray-900 text-white rounded-lg p-4 shadow-xl max-w-xs w-64 relative">
          {/* Arrow */}
          <div className={`absolute ${
            position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-t-8 border-x-transparent border-x-8' :
            position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-b-8 border-x-transparent border-x-8' :
            position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-l-8 border-y-transparent border-y-8' :
            'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-r-8 border-y-transparent border-y-8'
          }`} />
          
          <div className="flex items-start justify-between">
            <p className="text-sm leading-relaxed pr-4">{content}</p>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors flex-shrink-0"
              aria-label="Dismiss tooltip"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

