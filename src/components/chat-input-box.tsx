import * as React from 'react';
import { useEffect, useRef } from 'react';

export default function ChatInputBox({ onSubmit, disabled }) {
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
      }
    }
  });

  function submitTextarea() {
    const textarea = textareaRef.current;
    // chrome.runtime.sendMessage({ type: 'CLOSE_MODAL' });

    if (textarea) {
      const value = textarea.value.trim();
      if (value) {
        onSubmit(value);
      }
      textarea.value = '';
    }
  }

  return (
    <div className="flex-2 pt-4 pb-4">
      <div className="write flex">
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();
            submitTextarea();
          }}
        >
          <div className="flex items-center dark:bg-gray-600">
            <textarea
              id="chat"
              rows={3}
              ref={textareaRef}
              className="block mr-4 p-2.5 w-full text-xs text-gray-700 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"
              placeholder="Type your bookmark wish here..."
              onKeyDown={(k) => {
                if (k.key === 'Enter') {
                  k.preventDefault();
                  submitTextarea();
                }
              }}
              disabled={disabled}
            ></textarea>
            <button
              type="submit"
              className="inline-flex justify-center p-4 text-gray-300 rounded-md cursor-pointer dark:text-gray-200 hover:bg-gray-400 hover:text-gray-900 hover:dark:text-gray-700 "
            >
              <svg
                className="w-5 h-5 rotate-90"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 20"
              >
                <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
