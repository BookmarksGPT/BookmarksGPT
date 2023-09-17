// hyperthetical AI 07b001e8-d7fc-4563-b49d-028d9fb40e5f

import 'flowbite';
import * as React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { PouchDB } from 'react-pouchdb';
import ChatContainer from './pages/chat-container.tsx';

import { posthog } from 'posthog-js';
import './content-scripts/recorder-v2.js';

function Popup() {
  const [bookmarksIndexed, setBookmarksIndexed] = useState(null);

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
          setBookmarksIndexed(numOfBookmarks);
        });
      });
    }
  }, []);

  return (
    <PouchDB name="BookmarksGPT">
      <ChatContainer bookmarksIndexed={bookmarksIndexed} />
    </PouchDB>
  );
}

const root = document.getElementById('react-target');
const concurrentRoot = createRoot(root!);
concurrentRoot.render(<Popup />);
// render(<Popup />, document.getElementById('react-target'));
