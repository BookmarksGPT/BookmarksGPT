import 'flowbite';
import * as React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { createRoot } from 'react-dom/client';
import ChatContainer from './pages/chat-container.tsx';

import { posthog } from 'posthog-js';
import './content-scripts/recorder-v2.js';

function Popup() {
  const [bookmarksIndexed, setBookmarksIndexed] = useState(null);
  const [isPending, startTransition] = useTransition();

  if (!posthog.__loaded) {
    // console.log('posthog init');
    // posthog.init(process.env.POSTHOG_API_KEY!, {
    //   api_host: 'https://app.posthog.com',
    //   debug: true,
    //   persistence: 'localStorage',
    //   enable_recording_console_log: true,
    //   session_recording: {
    //     recordCrossOriginIframes: true,
    //   },
    // });
  }

  useEffect(() => {
    async function initBookmarks() {
      return await chrome.bookmarks.getTree();
    }

    if (!bookmarksIndexed) {
      initBookmarks().then((bookmarks) => {
        console.log('Initialize started');
        chrome.runtime.sendMessage({ type: 'INITIALIZE', bookmarks }, async (numOfBookmarks) => {
          console.log('Initialize completed');
          startTransition(() => {
            setBookmarksIndexed(numOfBookmarks);
          });
        });
      });
    }
  }, [isPending]);

  return <ChatContainer bookmarksIndexed={bookmarksIndexed} />;
}

const root = document.getElementById('react-target');
const concurrentRoot = createRoot(root!);
concurrentRoot.render(<Popup />);
// render(<Popup />, document.getElementById('react-target'));
