import React from 'react';
import Lottie from 'lottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// We'll load the Lottie file dynamically since it's a binary file
const processingAnimationUrl = '/processing.lottie';

const LottieLoader = ({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false, 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32'
  };

  const lottieSize = sizeClasses[size] || sizeClasses.medium;

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={lottieSize}>
        <Lottie 
          src={processingAnimationUrl}
          loop={true}
          autoplay={true}
        />
        <DotLottieReact
          src={processingAnimationUrl}
          loop
          autoplay
        />
      </div>
      {text && (
        <p className="text-gray-600 text-sm mt-2 font-medium">{text}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="h-full fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
};

export default LottieLoader; 