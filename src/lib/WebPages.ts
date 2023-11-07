import PouchDB from 'pouchdb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { fetchWebsite } from './DomNode.ts';
import { WebsiteDocument } from './website.ts';
import { Summarization } from './Summarization.ts';

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
      temperature: 0,
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

  static async summarize(text) {
    // Fetch the summary for the given text and display it
    // Use the user's stored API key
    // Set up the request to send to the endpoint
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer ' + process.env.COHERE_TRIAL_API_KEY,
      },
      // These are the summarize endpt paramters.
      // Try playing around with them and reloading the extension to see
      // how they affect the summarization behaviour.
      // Reference: https://docs.cohere.com/reference/summarize-2
      body: JSON.stringify({
        length: 'short',
        format: 'auto',
        model: 'summarize-xlarge',
        extractiveness: 'low',
        temperature: 0.1,
        text: text,
        // We tell the model that it's summarizing a webpage
        additional_command: 'of this webpage',
      }),
    };

    fetch('https://api.cohere.ai/v1/summarize', options)
      .then((response) => response.json())
      .then((response) => {
        if (response.summary === undefined) {
          // If there's no summary in the endpoint's response,
          // display whatever error message it returned
          console.log('There was an error: ' + response.message);
        } else {
          // Otherwise, display the summary
          console.log('tl;dr: ' + response.summary);
        }
      });
  }

  static async rerank() {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer ' + process.env.COHERE_TRIAL_API_KEY,
        // authorization: 'Bearer M2A6CFCN6cpsFXSngk2LUFkAGMMgtLWFm5WryLP0',
      },
      body: JSON.stringify({
        return_documents: false,
        max_chunks_per_doc: 10,
        model: 'rerank-english-v2.0',
        query: 'What is the capital of the United States?',
        documents: [
          'Carson City is the capital city of the American state of Nevada.',
          'The Commonwealth of the Northern Mariana Islands is a group of islands in the Pacific Ocean. Its capital is Saipan.',
          'Washington, D.C. (also known as simply Washington or D.C., and officially as the District of Columbia) is the capital of the United States. It is a federal district.',
          'Capital punishment (the death penalty) has existed in the United States since before the United States was a country. As of 2017, capital punishment is legal in 30 of the 50 states.',
        ],
      }),
    };

    fetch('https://api.cohere.ai/v1/rerank', options)
      .then((response) => response.json())
      .then((response) => {
        if (response.results === undefined) {
          // If there's no summary in the endpoint's response,
          // display whatever error message it returned
          console.log('There was an error: ' + response.message);
        } else {
          // Otherwise, display the summary
          console.log('reranked:');
          console.log(response.results);
        }
      });
  }

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
          title: webSiteInJSON.title,
          description: webSiteInJSON.description,
          text: webSiteInJSON.text,
          chunks: webSiteInJSON.chunks,
          updatedAt: now,
          createdAt: existingDoc?.createdAt || now,
        };
        console.info(`WebPages::add modifier`, modifier);
        const result = await WebPages.db.upsert(url, function (upsertDoc: WebsiteDocument) {
          Object.assign(upsertDoc, { ...modifier });
          return upsertDoc;
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
    const modifier = {
      status,
      statusUpdatedAt: new Date(),
    };
    return this.update(url, modifier);
  }

  static async update(url, modifier = {}) {
    let doc;
    try {
      doc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];
      console.info(`WebPages::update existingDoc`, doc?.chunks);
      modifier = {
        updatedAt: new Date(),
      };
      console.info(`WebPages::update modifier`, modifier);
      const result = await WebPages.db.upsert(url, function (upsertDoc: WebsiteDocument) {
        Object.assign(upsertDoc, { ...modifier });
        return upsertDoc;
      });
      console.info(`WebPages::update result`, result);
    } catch (err) {
      console.error(err);
    }

    return {
      ...doc,
      ...modifier,
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
        summary: await Summarization.generateSummaryFromChunks(WebPages.llm, url, doc?.chunks),
      };
      console.info(`WebPages::addSummary modifier`, modifier);
      const result = await WebPages.db.upsert(url, function (upsertDoc: WebsiteDocument) {
        Object.assign(upsertDoc, { ...modifier });
        return upsertDoc;
      });
      console.info(`WebPages::add result`, result);
      await WebPages.updateStatus(url, 'IDLE');
    } catch (err) {
      console.error(err);
    }

    return {
      ...doc,
      ...modifier,
    };
  }
  static async addStructuredSummary(url, structure) {
    // TODO: skip if the summary was added > the last update.
    let modifier = {};
    let doc;
    try {
      doc = (await WebPages.db.find({ selector: { _id: url } })).docs?.[0];
      console.info(`WebPages::addStructuredSummary existingDoc`, doc?.chunks);
      await WebPages.updateStatus(url, 'GENERATING_SUMMARY');
      modifier = {
        structuredSummaryUpdatedAt: new Date(),
        structuredSummary: await Summarization.generateStructuredSummaryFromChunks(
          WebPages.llm,
          url,
          doc?.chunks,
          structure
        ),
      };
      console.info(`WebPages::addStructuredSummary modifier`, modifier);
      const result = await WebPages.db.upsert(url, function (upsertDoc: WebsiteDocument) {
        Object.assign(upsertDoc, { ...modifier });
        return upsertDoc;
      });
      console.info(`WebPages::addStructuredSummary result`, result);
      await WebPages.updateStatus(url, 'IDLE');
    } catch (err) {
      console.error(err);
    }

    return {
      ...doc,
      ...modifier,
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
}
