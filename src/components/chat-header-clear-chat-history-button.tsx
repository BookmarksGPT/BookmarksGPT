import * as React from 'react';
import { MessageType } from '../pages/chat-container.tsx';
import { useAllDocs, useDB, useFind } from 'react-pouchdb';

export default function ChatHeaderClearChatHistoryButton({ setDisableInput }) {
  const db = useDB();
  function onClick() {
    setDisableInput(true);
    db.allDocs()
      .then((docs) => {
        console.log(docs);
        return Promise.allSettled(
          docs.rows.map((doc) => {
            if (doc?.id) {
              return db.remove(doc.id, doc.value.rev);
            }
          })
        );
      })
      .then((res) => {
        console.log(`Database update completed`);
        console.log(res);
        db.post({
          type: MessageType.system,
          message: `Chat history cleared! Let's start afresh!`,
          timestamp: Date.now(),
        });
        setDisableInput(false);
      });
  }

  return (
    <span
      className="cursor-pointer inline-block ml-8 text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:dark:text-gray-700 align-bottom"
      onClick={onClick}
    >
      <span
        data-tooltip-target="header-clear-chat-history-tooltip"
        className="block h-6 w-6 p-1 rounded-full hover:bg-gray-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </span>
      <div
        id="header-clear-chat-history-tooltip"
        role="tooltip"
        className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
      >
        Clear your chat history.
        <div
          className="tooltip-arrow"
          data-popper-arrow
        ></div>
      </div>
    </span>
  );
}
