import 'flowbite';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import ChatContainer from './pages/chat-container.tsx';

function Popup() {
  const [bookmarksIndexed, setBookmarksIndexed] = useState(null);

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
