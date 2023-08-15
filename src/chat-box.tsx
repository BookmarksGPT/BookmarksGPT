import * as React from 'react';
import { useEffect, useState, useRef } from 'react';

function ChatHeader() {
  return (
    <div className="py-4 flex-2 flex flex-row items-center">
      <div className="flex">
        <span className="inline-block text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-700 align-bottom">
          <span className="block h-6 w-6 p-1 rounded-full hover:bg-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </span>
        </span>
        <span className="inline-block text-gray-700 dark:text-gray-200 align-bottom text-base">
          <span className="font-semibold">Bookmarks</span>
          <span className="font-thin">GPT</span>
        </span>
      </div>
      <div className="flex-1 text-right">
        <span className="inline-block ml-8 text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:dark:text-gray-700 align-bottom">
          <span className="block h-6 w-6 p-1 rounded-full hover:bg-gray-400">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </span>
        </span>
      </div>
    </div>
  );
}

function BotBubble({ text, timestamp }) {
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

function BotIsThinking() {
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
            <span className="text-gray-600  animate-pulse dark:text-gray-300">hmm... let me think...</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text, timestamp }) {
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

function InputBox({ onSubmit, disabled }) {
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
          <div className="flex items-center bg-gray-50 dark:bg-gray-600">
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

enum MessageType {
  system = 'system',
  user = 'user',
}

interface Message {
  type: MessageType;
  message: string;
  timestamp: Date;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: MessageType.system,
      message: 'Welcome to Bookmarks GPT! How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [disableInput, setDisableInput] = useState(false);
  const messagesRef = useRef<null | HTMLDivElement>(null);

  async function apendMessage(message) {
    messages.push(message);
    setMessages(messages);
  }

  async function onSubmit(message) {
    setDisableInput(true);
    await apendMessage({
      type: MessageType.user,
      message: message,
      timestamp: new Date(),
    });
    chrome.runtime.sendMessage({ message }, async (response) => {
      await apendMessage({
        type: MessageType.system,
        message: response,
        timestamp: new Date(),
      });

      setDisableInput(false);
      const messagesElement = messagesRef?.current;
      if (messagesElement) {
        messagesElement.scrollTo(0, messagesElement.scrollHeight);
      }
    });
  }

  return (
    <div
      className="backdrop-blur-md bg-white/30 dark:bg-gray-600"
      style={{ width: 400, height: 600 }}
    >
      <div className="main-body container m-auto w-11/12 h-full flex flex-col">
        <ChatHeader />
        <div
          className="messages flex-1 overflow-auto h-full flex flex-col scroll-smooth"
          ref={messagesRef}
        >
          {messages.map(({ type, message }) => {
            return type === MessageType.system ? (
              <BotBubble
                text={message}
                timestamp={'now'}
              />
            ) : (
              <UserBubble
                text={message}
                timestamp={'now'}
              />
            );
          })}
          {disableInput && <BotIsThinking />}
        </div>
        <InputBox
          onSubmit={onSubmit}
          disabled={disableInput}
        />
      </div>
    </div>
  );
}
