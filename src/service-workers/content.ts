import turndown from 'turndown';
// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractData') {
    const turndownService = new turndown();
    const clonedBody = document.body.cloneNode(true).parentNode;
    const clonedHead = document.head.cloneNode(true).parentNode;

    const images = clonedBody?.querySelectorAll('img');
    (images || []).forEach((img) => img.remove());

    const descriptionElement = clonedHead?.querySelector('meta[name="description"]') as HTMLMetaElement;
    const description = descriptionElement ? descriptionElement.content : null;

    const headers = Array.from(clonedBody?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, code, span') || []).map(
      (header) => ({
        tag: header.tagName,
        content: header.textContent,
      })
    );

    // Recreate a version of the page that resembles a document.
    // Assuming turndown is available globally, or you've imported it

    function convertHtmlToMarkdown(html) {
      return turndownService.turndown(html);
    }

    // let bodyHtml = document.body.innerHTML;
    const markdown = convertHtmlToMarkdown(document.body);

    sendResponse({ description, headers });
  }
});
