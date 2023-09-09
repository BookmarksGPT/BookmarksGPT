import { Conversation } from '../lib/conversation.ts';
import { Bookmarks } from '../lib/bookmarks.ts';

chrome.runtime.onMessage.addListener(({ type, message, bookmarks }, sender, sendResponse) => {
  switch (type) {
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
      Bookmarks.getVectorStore()
        .then((result) => {
          return result ?? Bookmarks.createBookmarkVectorStore(bookmarks);
        })
        .then((result) => {
          sendResponse(result.numBookmarks);
        });
      return true;
    case 'REQUEST':
      Conversation.getResponse(message).then((result) => {
        console.log('[REQUEST] Sending response to popup');
        sendResponse(result);
      });
      return true;
    default:
      sendResponse(true);
      return true;
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

// function injectModal() {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     const activeTab = tabs[0];
//     if (activeTab?.url?.startsWith('chrome://')) {
//       // Add some code to send a UX message that it doesn't work in here.
//     } else if (activeTab?.id) {
//       chrome.scripting.insertCSS(
//         {
//           target: { tabId: activeTab.id },
//           files: ['modal.css'],
//         },
//         () => {
//           // Once CSS is injected, inject the JavaScript
//           chrome.scripting.executeScript({
//             target: { tabId: activeTab.id! },
//             files: ['modal.js'],
//           });
//         }
//       );
//     }
//   });
// }
