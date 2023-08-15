import * as React from 'react';
import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import ChatBox from './chat-box.tsx';

function download(index, data) {
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url,
      filename: `bookmarks/bookmark_${index}.txt`, // Optional, provide a filename
    },
    (downloadId) => {
      // If you want to do something after the download starts, put it here.
      URL.revokeObjectURL(url); // Clean up the object URL
    }
  );
}

function _nth(n) {
  return ['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th';
}

function getTitles(titles, bookmarks) {
  const { title, type, dateAdded } = bookmarks || {};
  if (title || type === 'bookmark') {
    titles.push(title);
    const createdAt = dateAdded;

    const fileTemplate = `On ${new Date(createdAt).toLocaleDateString()} I stored a bookmark with title "${title}".`;
    console.log(fileTemplate);
    // download(title.length, fileTemplate);
  }
  if (bookmarks?.children) {
    bookmarks?.children?.forEach((child) => {
      getTitles(titles, child);
    });
  }
}

function Popup() {
  // const [titles, setTitles] = useState([]);

  // useEffect(() => {
  //   async function getBookMarks() {
  //     const t = [];
  //     const bookmarks = await chrome.bookmarks.getTree();
  //     bookmarks.forEach((bookmark) => getTitles(t, bookmark));
  //     setTitles(t);
  //   }
  //   getBookMarks();
  // }, []);
  // console.log(titles);

  return <ChatBox />;
}

render(<Popup />, document.getElementById('react-target'));
