import { Parser } from 'htmlparser2';
import { Document } from 'langchain/document';
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text';
import PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-upsert'));

import { loadSummarizationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

interface WebsiteDocument {
  webSite: DomNode[];
}

async function fetchAndModify(request) {
  const originalResponse = await fetch(request);
  const text = await originalResponse.text();
  const domObject = parseAndManipulateDOM(text);

  const jsonResponse = JSON.stringify(domObject);

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

interface DomNode {
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

function parseAndManipulateDOM(htmlContent) {
  let rootNode = createNode('root');
  let currentParent = rootNode;

  const parentsStack = [rootNode];

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const newNode = createNode(name, attribs);
        currentParent?.children?.push(newNode);

        parentsStack.push(newNode);
        currentParent = newNode;
      },
      ontext(text) {
        if (text.trim()) {
          // only consider non-empty text nodes
          currentParent?.children?.push({
            type: 'text',
            content: text.trim(),
          });
        }
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

  return rootNode;
}

export class Websites {
  static db = new PouchDB<WebsiteDocument>('BookmarksGPTWebsites', {
    auto_compaction: true,
  });
  // static embeddings = new OpenAIEmbeddings({
  //   openAIApiKey: process.env.OPENAI_API_KEY,
  // });
  // static vectorStore;
  // static titles = [];

  constructor() {}

  static async add(url: string) {
    const webSite = await fetchAndModify(url);
    const webSiteInJSON = await webSite.json();
    await Websites.db.upsert(url, function (doc: WebsiteDocument) {
      if (!doc.webSite) {
        doc.webSite = webSiteInJSON;
      }
      return doc;
    });
  }
}

export class Website {
  constructor() {}
  static async getDescription(url) {
    let description;

    try {
      // TODO: timeout fetch per URL at ~10 seconds
      const web_site = await fetch(url);
      const html = await web_site.text();
      const parser = new DOMParser();
      const doc3 = parser.parseFromString(html, 'text/html');

      // Description
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
      description = match ? match[1] : '';

      console.log(`[${url}] Description: ${description}`);
    } catch (err) {
      throw new Error(err.message);
    }

    return description;
  }

  async getSummary({ title, url }) {
    console.log('FETCHING:', title, url);
    // maybe we need an LLM class
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
    });

    const fullUrl = new URL(url);

    try {
      const web_site = await fetch(url);
      const html = await web_site.text();

      // Description
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
      const description = match ? match[1] : null;

      // TODO: "https://youtu.be", localhost or .local, github
      if (fullUrl.hostname === 'github' || fullUrl.hostname === 'youtube') {
        return '';
      }

      // Summarization
      const transformer = new HtmlToTextTransformer();
      const splitter = RecursiveCharacterTextSplitter.fromLanguage('html');
      const sequence = splitter.pipe(transformer);
      const newDocuments = await sequence.invoke([
        new Document({
          pageContent: html,
          metadata: {},
        }),
      ]);
      // This convenience function creates a document chain prompted to summarize a set of documents.
      const chain = loadSummarizationChain(llm, { type: 'map_reduce' });
      const res = await chain.call({
        input_documents: newDocuments,
      });
      console.log(`[${title}/${url}] Description: ${description}`);
      console.log('RESULT:');
      // res.text <-- summary
      console.log(res?.text);
    } catch (err) {
      // TODO: store metadata if failed to retrieve content.
      console.error(`ERROR: ${url}`);
      console.error(err.message);
    }
  }
}
