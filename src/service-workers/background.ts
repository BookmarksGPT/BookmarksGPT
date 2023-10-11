import PouchDB from 'pouchdb';
import { Bookmarks } from '../lib/bookmarks.ts';
import { Conversation } from '../lib/conversation.ts';
import { MessageType } from '../pages/chat-container.tsx';

const pouch = new PouchDB('BookmarksGPT');

chrome.runtime.onMessage.addListener(({ type, message, bookmarks }, sender, sendResponse) => {
  switch (type) {
    case 'RESET_SESSION':
      // unimplemented
      // mechanism to know when exactly to fold past messages
      break;
    case 'RESET':
      console.log('Resetting the database');
      Bookmarks.createBookmarkVectorStore(bookmarks).then((result) => {
        sendResponse(result.numBookmarks);
        console.log('Fetching the descriptions');
        Bookmarks.updateVectorStoreWithDescriptions((progress) => {
          console.log(`Description fetching progress: ${progress}%`);
        });
      });
      return true;
    case 'INITIALIZE':
      pouch.post({
        type: MessageType.session,
        timestamp: Date.now(),
      });
      Bookmarks.getVectorStore()
        .then((result) => {
          return result ?? Bookmarks.createBookmarkVectorStore(bookmarks);
        })
        .then((result) => {
          console.log(result?.vectorStore);
          sendResponse(result.numBookmarks);
        });
      return true;
    case 'REQUEST':
      // Promise.allSettled([Bookmarks.getBySimilarity(message), run(message)]).then(
      //   (result: any) => {
      //     console.log('[REQUEST] Sending response to popup');
      //     console.log(result);
      //     sendResponse({ matches: result[0]?.value, response: result[1]?.value });
      //   }
      // );
      Promise.allSettled([Bookmarks.getBySimilarity(message), Conversation.generateChat(message)]).then(
        (result: any) => {
          console.log('[REQUEST] Sending response to popup');
          console.log(result);
          sendResponse({ matches: result[0]?.value, response: result[1]?.value?.response });
        }
      );
      return true;
    default:
      sendResponse(true);
      return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  console.log('click called for tab', tab?.id);
  if (tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const isOpen = document.getElementById('bookmarksgpt-frame');
        if (isOpen) {
          isOpen.remove();
          return;
        }
        const iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'bookmarksgpt-frame');
        iframe.setAttribute(
          'style',
          'border-radius: 10px; top: 10px;right: 10px; width: min(600px, 50%); min-width: 300px; height: calc(100% - 20px); z-index: 2147483650; border: 3px solid gray; position:fixed;'
        );
        iframe.setAttribute('allow', '');
        iframe.src = chrome.runtime.getURL('popup.html');
        document.body.appendChild(iframe);
        document.addEventListener('visibilitychange', function () {
          iframe.remove();
        });
      },
    });
  }
});

// // This is for doing something when the user bookmarks the current tab
// chrome.bookmarks.onCreated.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     const activeTab = tabs[0];
//     if (activeTab?.id) {
//       chrome.scripting.executeScript(
//         {
//           target: { tabId: activeTab.id },
//           files: ['content.js'],
//         },
//         () => {
//           const id = activeTab?.id;
//           if (id) {
//             chrome.tabs.sendMessage(id, { action: 'extractData' }, (response) => {
//               console.log(response);
//             });
//           }
//         }
//       );
//     }
//   });
// });
