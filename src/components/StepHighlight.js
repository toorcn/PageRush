'use client';
import React, { useEffect, useState } from 'react';

/**
 * Wrapper component that highlights its children when active
 * Used to draw attention to onboarding step targets
 */
export default function StepHighlight({ 
  children, 
  isActive = false, 
  pulseColor = 'blue',
  className = '' 
}) {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const colorClasses = {
    blue: 'ring-blue-500/50 shadow-blue-500/25',
    green: 'ring-green-500/50 shadow-green-500/25',
    purple: 'ring-purple-500/50 shadow-purple-500/25',
  };

  return (
    <div
      className={`
        transition-all duration-300 rounded-xl
        ${showHighlight ? `ring-4 ${colorClasses[pulseColor]} shadow-lg animate-pulse-highlight` : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
