import * as React from 'react';

export default function ChatUserBubble({ text, timestamp }) {
  return (
    <div className="message me mb-4 flex text-right">
      <div className="flex-1 px-2">
        <div className="inline-block bg-gray-300 text-gray-700 dark:bg-gray-700 rounded-l-lg rounded-br-lg p-2 px-6 dark:text-gray-200">
          <span>{text}</span>
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
