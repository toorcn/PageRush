'use client';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Contextual tooltip for providing hints during onboarding
 * Can be attached to any element to show guidance
 */
export default function OnboardingTooltip({ 
  children, 
  content, 
  position = 'top',
  show = false,
  onDismiss,
  id,
  persistent = false, // If true, won't auto-dismiss
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    // Check if this tooltip was dismissed before
    if (id) {
      const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]');
      if (dismissedTooltips.includes(id)) {
        setDismissed(true);
        return;
      }
    }
    setIsVisible(show);
  }, [show, id]);

  // Auto-dismiss after 5 seconds unless persistent
  useEffect(() => {
    if (isVisible && !persistent) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, persistent]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    
    // Save dismissed state if id provided
    if (id) {
      const dismissedTooltips = JSON.parse(localStorage.getItem('dismissedTooltips') || '[]');
      if (!dismissedTooltips.includes(id)) {
        dismissedTooltips.push(id);
        localStorage.setItem('dismissedTooltips', JSON.stringify(dismissedTooltips));
      }
    }
    onDismiss?.();
  };

  if (dismissed || !isVisible) {
    return <>{children}</>;
  }

  const positionStyles = {
    top: {
      container: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-8 border-x-transparent border-x-8',
    },
    bottom: {
      container: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-b-8 border-x-transparent border-x-8',
    },
    left: {
      container: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-l-8 border-y-transparent border-y-8',
    },
    right: {
      container: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-r-8 border-y-transparent border-y-8',
    },
  };

  const styles = positionStyles[position];

  return (
    <div className="relative inline-block">
      {children}
      <div 
        ref={tooltipRef}
        className={`absolute z-50 ${styles.container} animate-fadeIn`}
        role="tooltip"
      >
        <div className="bg-gray-900 text-white rounded-lg p-3 shadow-xl max-w-xs w-64 relative">
          {/* Arrow */}
          <div className={`absolute ${styles.arrow}`} />
          
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-relaxed">{content}</p>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-0.5"
              aria-label="Dismiss tooltip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage tooltip visibility based on onboarding progress
 */
export function useOnboardingTooltips() {
  const [tooltips, setTooltips] = useState({});

  const showTooltip = (id) => {
    setTooltips(prev => ({ ...prev, [id]: true }));
  };

  const hideTooltip = (id) => {
    setTooltips(prev => ({ ...prev, [id]: false }));
  };

  const isTooltipVisible = (id) => tooltips[id] || false;

  const resetTooltips = () => {
    localStorage.removeItem('dismissedTooltips');
    setTooltips({});
  };

  return { showTooltip, hideTooltip, isTooltipVisible, resetTooltips };
}
