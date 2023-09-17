import * as React from 'react';
import { MessageType } from '../pages/chat-container.tsx';

export default function ChatHeaderReindexButton({ setDisableInput, appendMessage }) {
  function onClick() {
    async function initBookmarks() {
      return await chrome.bookmarks.getTree();
    }
    appendMessage({
      type: MessageType.system,
      message: `Ok I'm on it!`,
      timestamp: new Date(),
    });
    setDisableInput(true);
    initBookmarks().then((bookmarks) => {
      chrome.runtime.sendMessage({ type: 'RESET', bookmarks }, async (numOfBookmarks) => {
        appendMessage({
          type: MessageType.system,
          message: `Bookmarks reindexed. You have ${numOfBookmarks} bookmarks in your library!`,
          timestamp: new Date(),
        });
        setDisableInput(false);
      });
    });
  }

  return (
    <span
      className="cursor-pointer inline-block text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:dark:text-gray-700 align-bottom"
      onClick={onClick}
    >
      <span
        data-tooltip-target="tooltip-default"
        className="block h-6 w-6 p-1 rounded-full hover:bg-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fill-rule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
      <div
        id="tooltip-default"
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        Re-create your bookmarks database.
        <br />
        <small>Note: this operation may consume a lot of OpenAI credits!</small>
        <div
          className="tooltip-arrow"
          data-popper-arrow
        ></div>
      </div>
    </span>
  );
}
