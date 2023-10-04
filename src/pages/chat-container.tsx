import * as React from 'react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useDB, useFind } from 'react-pouchdb';
import ChatAIBubble from '../components/chat-ai-bubble.tsx';
import ChatAIIsThinkingBubble from '../components/chat-ai-is-thinking-bubble.tsx';
import ChatHeader from '../components/chat-header.tsx';
import ChatInputBox from '../components/chat-input-box.tsx';
import ChatMatches from '../components/chat-matches.tsx';
import ChatUserBubble from '../components/chat-user-bubble.tsx';

export enum MessageType {
  session = 'session',
  system = 'system',
  user = 'user',
  bot = 'bot',
}

interface Message {
  type: MessageType;
  message: string;
  timestamp: Date;
}

export default function ChatContainer({ bookmarksIndexed }) {
  const [isPending, startTransition] = useTransition();
  const [disableInput, setDisableInput] = useState(false);
  const messagesRef = useRef<null | HTMLDivElement>(null);

  const db = useDB();

  const mostRecentSession = useFind({
    selector: {
      type: MessageType.session,
      timestamp: { $exists: true },
    },
    sort: [{ timestamp: 'desc' }],
    limit: 1,
  });

  if (!mostRecentSession) return null;

  const messages = useFind({
    selector: {
      type: { $exists: true },
      timestamp: { $gte: mostRecentSession.timestamp },
    },
    sort: ['timestamp'],
  });

  function appendMessage(options) {
    const { type, message, matches } = options;
    startTransition(() => {
      db.post({
        type,
        message,
        matches,
        timestamp: Date.now(),
      });
    });
  }

  function scrollToBottom() {
    const messagesElement = messagesRef?.current;
    if (messagesElement) {
      messagesElement.scrollTo(0, messagesElement.scrollHeight);
    }
  }

  async function onSubmit(message) {
    setDisableInput(true);
    appendMessage({
      type: MessageType.user,
      message: message,
      timestamp: new Date(),
    });
    console.log('message submitted');
    chrome.runtime.sendMessage({ type: 'REQUEST', message }, async ({ response, matches }) => {
      console.log('response received');
      appendMessage({
        type: MessageType.bot,
        message: response,
        matches,
      });
      setDisableInput(false);
    });
  }

  useEffect(() => {
    if (bookmarksIndexed) {
      appendMessage({
        type: MessageType.system,
        message: `Welcome to Bookmarks GPT! You have ${bookmarksIndexed} bookmarks in your library! How can I help you today?`,
      });
    }
  }, [bookmarksIndexed]);

  useEffect(() => {
    scrollToBottom();
  }, [messages?.length]);

  return (
    <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-600 h-full w-full">
      <div className="main-body container m-auto w-11/12 h-full flex flex-col">
        <ChatHeader
          appendMessage={appendMessage}
          setDisableInput={setDisableInput}
        />
        <div
          className="messages flex-1 overflow-auto h-full flex flex-col scroll-smooth"
          ref={messagesRef}
        >
          {messages?.map(({ type, message, timestamp, matches }) => {
            switch (type) {
              case MessageType.session:
                return (
                  <ol className="text-center font-light text-gray-600 dark:text-gray-200">
                    <small>
                      {`Session restarted at ${new Date(timestamp).toLocaleDateString()} ${new Date(
                        timestamp
                      ).toLocaleTimeString()}`}
                    </small>
                  </ol>
                );
              case MessageType.system:
                return (
                  <ChatAIBubble
                    text={message}
                    timestamp={`${new Date(timestamp).toLocaleDateString()} ${new Date(
                      timestamp
                    ).toLocaleTimeString()}`}
                  />
                );
              case MessageType.user:
                return (
                  <ChatUserBubble
                    text={message}
                    timestamp={`${new Date(timestamp).toLocaleDateString()} ${new Date(
                      timestamp
                    ).toLocaleTimeString()}`}
                  />
                );
              case MessageType.bot:
                const flatten_matches =
                  matches?.map((r) => ({
                    pageContent: r[0].pageContent,
                    metadata: r[0].metadata,
                    score: r[1],
                  })) || [];
                return (
                  <>
                    <ChatMatches matches={flatten_matches} />
                    <ChatAIBubble
                      text={message}
                      timestamp={`${new Date(timestamp).toLocaleDateString()} ${new Date(
                        timestamp
                      ).toLocaleTimeString()}`}
                    />
                  </>
                );
            }
          })}
          {!bookmarksIndexed && <ChatAIIsThinkingBubble text="Please wait....I'm loading your bookmarks" />}
          {bookmarksIndexed && disableInput && <ChatAIIsThinkingBubble text="hmm... let me think!" />}
        </div>
        <ChatInputBox
          onSubmit={bookmarksIndexed ? onSubmit : () => null}
          disabled={!bookmarksIndexed || disableInput}
        />
      </div>
    </div>
  );
}
