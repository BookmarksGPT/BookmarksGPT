import { OpenAI } from 'langchain/llms/openai';

// This is for doing something when the user bookmarks the current tab
// chrome.bookmarks.onCreated.addListener(() => {
// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//   const activeTab = tabs[0];
//   if (activeTab?.id) {
//     chrome.scripting.executeScript(
//       {
//         target: { tabId: activeTab.id },
//         files: ['content.js'],
//       },
//       () => {
//         const id = activeTab?.id;
//         if (id) {
//           chrome.tabs.sendMessage(id, { action: 'extractData' }, (response) => {
//             // Store the extracted data or do something else with it
//             console.log(response);
//           });
//         }
//       }
//     );
//   }
// });
// });

chrome.runtime.onMessage.addListener(({ type, message }, sender, sendResponse) => {
  async function getResponse() {
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
    });
    return await llm.predict(message);
  }

  getResponse().then((result) => {
    sendResponse(result);
  });

  return true;
});
