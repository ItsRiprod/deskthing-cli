import React, { useState } from "react";

const ActionsPage: React.FC = () => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = (action: () => void, message: string) => {
    action();
    setFeedback(message);
    setTimeout(() => setFeedback(null), 1500);
  };

  return (
    <div className="p-6 bg-black rounded-lg max-w-2xl mx-auto border border-gray-800 shadow-lg">
      <h2 className="text-white text-xl font-semibold mb-6">Developer Utilities</h2>
      <div className="space-y-4">
        <button
          className="w-full px-6 py-2 rounded bg-black text-white font-medium border border-purple-600 shadow-[0_4px_24px_0_rgba(147,51,234,0.3)] hover:bg-gray-900 transition-all duration-200"
          onClick={() => handleAction(() => window.location.reload(), "Page reloaded!")}
        >
          Reload Page
        </button>
        <button
          className="w-full px-6 py-2 rounded bg-black text-white font-medium border border-purple-600 shadow-[0_4px_24px_0_rgba(147,51,234,0.3)] hover:bg-gray-900 transition-all duration-200"
          onClick={() => handleAction(() => window.localStorage.clear(), "Local storage cleared!")}
        >
          Clear Local Storage
        </button>
        <button
          className="w-full px-6 py-2 rounded bg-black text-white font-medium border border-purple-600 shadow-[0_4px_24px_0_rgba(147,51,234,0.3)] hover:bg-gray-900 transition-all duration-200"
          onClick={() => handleAction(() => window.sessionStorage.clear(), "Session storage cleared!")}
        >
          Clear Session Storage
        </button>
        {/* Add more utility buttons here as needed */}
      </div>
      {feedback && (
        <div className="mt-6 text-purple-400 text-center font-semibold flex items-center justify-center space-x-2">
          <span>{feedback}</span>
          <svg
            className="w-5 h-5 text-purple-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default ActionsPage;
