import * as React from 'react';

export default function ChatAIBubble({ text, timestamp }) {
  return (
    <div className="message mb-4 flex">
      <div className="flex-2">
        <div className="w-12 h-12 relative">
          <img
            className="w-12 h-12 rounded-full mx-auto"
            src="../icons/icon128.png"
            alt="chat-user"
          />
        </div>
      </div>
      <div className="flex-1 px-2">
        <div className="inline-block bg-cyan-100 dark:bg-cyan-700 dark:text-gray-200 rounded-r-lg rounded-bl-lg p-2 px-6 text-gray-700 hyphens-auto">
          {text}
        </div>
        {timestamp && (
          <div className="pl-4">
            <small className="text-gray-500">{timestamp}</small>
          </div>
        )}
      </div>
    </div>
  );
}
