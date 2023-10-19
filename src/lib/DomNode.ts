import { Parser } from 'htmlparser2';

export async function fetchWebsite(request) {
  const originalResponse = await fetch(request);
  const text = await originalResponse.text();
  const parsedWebsite = parseAndManipulateDOM(text);

  const jsonResponse = JSON.stringify({ ...parsedWebsite, text });

  return new Response(jsonResponse, {
    headers: {
      ...originalResponse.headers,
      'Content-Type': 'application/json',
    },
  });
}
interface NodeAttributes {
  [key: string]: string;
}
export interface DomNode {
  type: string;
  attributes?: NodeAttributes;
  children: Array<DomNode | TextNode>;
}
interface TextNode {
  type: 'text';
  content: string;
}
function createNode(tagName: string, attributes: NodeAttributes = {}): DomNode {
  return {
    type: tagName,
    children: [],
  };
}

function chunkString(str, length) {
  return str.match(new RegExp('(.|[\r\n]){1,' + length + '}', 'g'));
}

function hasWhiteSpace(s) {
  return /\s/g.test(s);
}
function parseAndManipulateDOM(htmlContent) {
  let rootNode = createNode('root');
  let currentParent = rootNode;
  let description = '';
  let chunks = [''];
  const parentsStack = [rootNode];

  // TODO: Give higher weight to h1, h2, h3, h4 and text within the same parent
  // TODO: Give higher weight to elements earlier in the document
  // TODO: consider stripping the tree from nodes that are not important and feeding that to the HTML parser
  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const newNode = createNode(name, attribs);
        currentParent?.children?.push(newNode);
        if (name === 'meta' && attribs.name === 'description') {
          description = attribs.content;
        }
        parentsStack.push(newNode);
        currentParent = newNode;
      },
      onattribute(name, value) {
        // console.log(`onattribute `, currentParent, name, value);
      },
      ontext(text) {
        const trimmedText = text.trim();
        if (trimmedText) {
          // only consider non-empty text nodes
          currentParent?.children?.push({
            type: 'text',
            content: text.trim(),
          });

          // ignore head and scripts
          if (!parentsStack.find((p) => ['head', 'script', 'a', 'style'].includes(p.type))) {
            const subChunks = chunkString(trimmedText, 2000);
            subChunks.forEach((subChunk) => {
              // ignore strings that are >50 characters long without a white space
              if (subChunk.length > 50 && !hasWhiteSpace(subChunk)) {
                return;
              }
              if (subChunk.length + chunks[0].length > 2000) {
                chunks.unshift(subChunk);
              } else {
                chunks[0] += `\n\n${subChunk}`;
              }
            });
          }
        }
        // TODO: do chunking here.
      },
      onclosetag() {
        parentsStack.pop();
        currentParent = parentsStack[parentsStack.length - 1];
      },
    },
    { decodeEntities: true }
  );

  parser.write(htmlContent);
  parser.end();

  return { rootNode, description, chunks };
}
