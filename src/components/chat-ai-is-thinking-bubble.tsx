import * as React from 'react';

export default function ChatAIIsThinkingBubble({ text }) {
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
      <div className="flex-1 px-2 flex items-center">
        <div className="px-3 py-1 text-xs leading-none rounded-r-lg rounded-bl-lg flex">
          <span className="animate-bounce">
            <span className="text-gray-600  animate-pulse dark:text-gray-300">{text}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
