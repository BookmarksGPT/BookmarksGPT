import 'flowbite';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import ChatContainer from './pages/chat-container.tsx';

import './content-scripts/recorder-v2.js';
import { posthog } from 'posthog-js';

function Popup() {
  const [bookmarksIndexed, setBookmarksIndexed] = useState(null);

  if (!posthog.__loaded) {
    console.log('posthog init');
    posthog.init(process.env.POSTHOG_API_KEY!, {
      api_host: 'https://app.posthog.com',
      debug: true,
      persistence: 'localStorage',
      enable_recording_console_log: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    });
  }

  useEffect(() => {
    async function initBookmarks() {
      return await chrome.bookmarks.getTree();
    }

    initBookmarks().then((bookmarks) => {
      chrome.runtime.sendMessage({ type: 'INITIALIZE', bookmarks }, async (numOfBookmarks) => {
        setBookmarksIndexed(numOfBookmarks);
      });
    });
  }, []);

  return <ChatContainer bookmarksIndexed={bookmarksIndexed} />;
}

render(<Popup />, document.getElementById('react-target'));
