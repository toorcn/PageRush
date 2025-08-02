import React from 'react';
import Lottie from 'lottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// We'll load the Lottie file dynamically since it's a binary file
const processingAnimationUrl = '/processing.lottie';

const FullPageLoader = ({ 
  text = 'Loading...', 
  showLogo = true,
  className = '' 
}) => {
  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-8 lg:p-12 text-center shadow-2xl max-w-md mx-4">
        <div className={`flex flex-col items-center justify-center ${className}`}>
          {/* PageRush AI Logo */}
          {showLogo && (
            <div className="mb-6">
              <img 
                src="/pagerushai-logo.png" 
                alt="PageRush AI" 
                className="h-16 w-auto mx-auto"
              />
            </div>
          )}
          
          {/* Loading Animation */}
          <div className="w-20 h-20 mb-4">
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
          
          {/* Loading Text */}
          {text && (
            <p className="text-gray-700 text-lg font-medium">{text}</p>
          )}
          
          {/* Additional branding */}
          <p className="text-gray-500 text-sm mt-2">Powered by PageRush AI</p>
        </div>
      </div>
    </div>
  );
};

export default FullPageLoader; 