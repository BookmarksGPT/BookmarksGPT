import { Document } from 'langchain/document';
import { HtmlToTextTransformer } from 'langchain/document_transformers/html_to_text';
import PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-upsert'));

import { loadSummarizationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DomNode, fetchWebsite } from './DomNode.ts';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

interface WebsiteDocument {
  webSite: DomNode[];
  updatedAt: Date;
  createdAt: Date;
}

export class WebPages {
  static db = new PouchDB<WebsiteDocument>('BookmarksGPTWebPages', {
    auto_compaction: true,
  });
  static embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  static vectorStore: MemoryVectorStore = new MemoryVectorStore(WebPages.embeddings);
  static llm = new OpenAI(
    {
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
    },
    {
      basePath: 'https://oai.hconeai.com/v1',
      baseOptions: {
        headers: {
          'Helicone-Auth': 'Bearer sk-lk7x3qy-2fyuxna-rs4nfay-egycxdq',
        },
      },
    }
  );

  constructor() {}

  static async clear() {
    const destroyed = await WebPages.db.destroy();
    console.info(`WebPages:clear destroyed`, destroyed);
    WebPages.db = new PouchDB<WebsiteDocument>('BookmarksGPTWebPages', {
      auto_compaction: true,
    });
    const info = await WebPages.db.info();
    console.info(`WebPages:clear info`, info);
    return;
  }

  static async add(url: string, daysSinceLastUpdate: number = 0) {
    console.info(`WebPages::add ${url}, ${daysSinceLastUpdate}`);
    let modifier = {};
    let updateIfBefore = new Date();
    updateIfBefore.setUTCHours(0, 0, 0, 0);
    updateIfBefore.setDate(updateIfBefore.getDate() - daysSinceLastUpdate);
    console.info(`WebPages::add updateIfBefore = ${updateIfBefore}`);

    try {
      const existingDoc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];
      console.info(`WebPages::add existingDoc`, existingDoc);
      if (!existingDoc || existingDoc?.updatedAt < updateIfBefore) {
        const now = new Date();
        const webSite = await fetchWebsite(url);
        const webSiteInJSON = await webSite.json();
        modifier = {
          webSite: webSiteInJSON.rootNode,
          description: webSiteInJSON.description,
          text: webSiteInJSON.text,
          chunks: webSiteInJSON.chunks,
          updatedAt: now,
          createdAt: existingDoc?.createdAt || now,
        };
        console.info(`WebPages::add modifier`, modifier);
        const result = await WebPages.db.upsert(url, function (doc: WebsiteDocument) {
          Object.assign(doc, { ...modifier });
          return doc;
        });
        console.info(`WebPages::add result`, result);
      }
    } catch (err) {
      console.error(err);
    }
    return {
      url,
      ...modifier,
    };
  }

  static async updateStatus(url, status) {
    let modifier = {};
    let doc;
    try {
      doc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];
      console.info(`WebPages::updateStatus existingDoc`, doc?.chunks);
      modifier = {
        status,
        statusUpdatedAt: new Date(),
      };
      console.info(`WebPages::updateStatus modifier`, modifier);
      const result = await WebPages.db.upsert(url, function (doc: WebsiteDocument) {
        Object.assign(doc, { ...modifier });
        return doc;
      });
      console.info(`WebPages::updateStatus result`, result);
    } catch (err) {
      console.error(err);
    }

    return {
      ...doc,
    };
  }

  static async addSummary(url) {
    // TODO: skip if the summary was added > the last update.
    let modifier = {};
    let doc;
    try {
      doc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];
      console.info(`WebPages::addSummary existingDoc`, doc?.chunks);
      await WebPages.updateStatus(url, 'GENERATING_SUMMARY');
      modifier = {
        updatedAt: new Date(),
        summary: await WebPages.generateSummaryFromChunks(url, doc?.chunks),
      };
      console.info(`WebPages::addSummary modifier`, modifier);
      const result = await WebPages.db.upsert(url, function (doc: WebsiteDocument) {
        Object.assign(doc, { ...modifier });
        return doc;
      });
      console.info(`WebPages::add result`, result);
      await WebPages.updateStatus(url, 'IDLE');
    } catch (err) {
      console.error(err);
    }

    return {
      ...doc,
    };
  }

  private static async addVector({ title, url, createdAt, index, description, fetchFailed }) {
    const fullUrl = new URL(url);
    WebPages.vectorStore.addDocuments([
      {
        pageContent: `{
            title: ${title},
            URL: ${fullUrl.hostname}${fullUrl.pathname},
            created_at: ${createdAt}
        }`,
        metadata: {
          index,
          title,
          url,
          createdAt,
          description,
          fetchFailed,
        },
      },
    ]);
  }

  private static async generateSummaryFromChunks(url, chunks?, context?) {
    try {
      const newDocuments = chunks.map(
        (pageContent) =>
          new Document({
            pageContent,
            metadata: { url },
          })
      );

      console.info(
        `WebPages::generateSummary newDocuments ${newDocuments.length} chars: ${newDocuments.reduce(
          (sum, doc) => sum + doc.pageContent.length,
          0
        )} `
      );

      const chain = loadSummarizationChain(WebPages.llm, { type: 'map_reduce', verbose: true });
      const res = await chain.call({
        input_documents: newDocuments,
        timeout: 45000,
      });
      // res.text <-- summary
      console.info('WebPages::generateSummary res.text', res?.text);
      return res?.text;
    } catch (err) {
      console.error(err);
    }
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

      // TODO: move to function with pagecontent/metadata/context <== combined prompt

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
