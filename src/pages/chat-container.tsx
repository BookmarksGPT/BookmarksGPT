import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import ChatAIIsThinkingBubble from '../components/chat-ai-is-thinking-bubble.tsx';
import ChatHeader from '../components/chat-header.tsx';
import ChatInputBox from '../components/chat-input-box.tsx';
import ChatMatches from '../components/chat-matches.tsx';
import ChatUserBubble from '../components/chat-user-bubble.tsx';
import ChatAIBubble from '../components/chat-ai-bubble.tsx';

export enum MessageType {
  system = 'system',
  user = 'user',
}

interface Message {
  type: MessageType;
  message: string;
  timestamp: Date;
}

export default function ChatContainer({ bookmarksIndexed }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [disableInput, setDisableInput] = useState(false);
  const messagesRef = useRef<null | HTMLDivElement>(null);

  function appendMessage(message) {
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  async function onSubmit(message) {
    setDisableInput(true);
    appendMessage({
      type: MessageType.user,
      message: message,
      timestamp: new Date(),
    });
    appendMessage({
      type: MessageType.system,
      message: 'hmm... let ne think...',
      timestamp: new Date(),
    });
    chrome.runtime.sendMessage({ type: 'REQUEST', message }, async ({ response, matches }) => {
      const flatten_matches = matches.map((r) => ({
        pageContent: r[0].pageContent,
        metadata: r[0].metadata,
        score: r[1],
      }));
      appendMessage({
        type: MessageType.system,
        message: ChatMatches(flatten_matches),
        timestamp: new Date(),
      });
      appendMessage({
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

  useEffect(() => {
    if (bookmarksIndexed) {
      appendMessage({
        type: MessageType.system,
        message: `Welcome to Bookmarks GPT! You have ${bookmarksIndexed} bookmarks in your library! How can I help you today?`,
        timestamp: new Date(),
      });
    }
  }, [bookmarksIndexed]);

  return (
    <div
      className="backdrop-blur-md bg-white/30 dark:bg-gray-600"
      style={{ width: 400, height: 600 }}
    >
      <div className="main-body container m-auto w-11/12 h-full flex flex-col">
        <ChatHeader
          appendMessage={appendMessage}
          setDisableInput={setDisableInput}
        />
        <div
          className="messages flex-1 overflow-auto h-full flex flex-col scroll-smooth"
          ref={messagesRef}
        >
          {messages.map(({ type, message }) => {
            return type === MessageType.system ? (
              <ChatAIBubble
                text={message}
                timestamp={'now'}
              />
            ) : (
              <ChatUserBubble
                text={message}
                timestamp={'now'}
              />
            );
          })}
          {!bookmarksIndexed && <ChatAIIsThinkingBubble text="Please wait....I'm loading your bookmarks" />}
        </div>
        <ChatInputBox
          onSubmit={bookmarksIndexed ? onSubmit : () => null}
          disabled={disableInput}
        />
      </div>
    </div>
  );
}
