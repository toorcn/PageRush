'use client';

export function Footer() {
  return (
    <footer className="mt-12 lg:mt-16 pt-8 border-t border-gray-200">
      <div className="text-center">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <img
            src="/pagerushai-logo.png"
            alt="PageRush AI"
            className="h-8 w-auto"
          />
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Transform your study materials into interactive learning tools
        </p>
        <p className="text-xs text-gray-400">
          Powered by AI • Built for Students • By Students (
          <a
            href="https://linkedin.com/in/hong-bing"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hong
          </a>
          )
        </p>
      </div>
    </footer>
  );
}
