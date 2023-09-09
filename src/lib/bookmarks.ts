import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Website } from './website.ts';

interface VectorStoreType {
  vectorStore: MemoryVectorStore;
  numBookmarks: number;
}

// TODO: DO NOT RETRY FAILED
// init db first time (same as full reset - this will eventually go in settings)
// add new bookmark
// update db with new stuff & fetch missing (and empty) descriptions || add new button for testing for now
// clean this up
// make sure it works for creating and vectorStore and updating the vectorStore


class ProgressTracker {
  total: any[];
  constructor(size: number) {
    this.total = Array(size).fill(false, 0, size);
    console.log(`ProgressTracker: ${this.total.length} initialized`);
  }

  updateProgress(index) {
    // update the total tracker
    this.total[index] = true;
    const completed = this.total.filter((t) => t === true);
    console.log(`updating index ${index} ${completed.length}/${this.total.length}`);
    return ~~((completed.length * 100) / this.total.length);
  }
}

export class Bookmarks {
  static embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  static vectorStore;
  static titles = [];
  constructor() {}

  private static getTitles(titles, bookmarks) {
    const { title, dateAdded, url } = bookmarks || {};
    if (title && url) {
      titles.push({
        title,
        createdAt: dateAdded,
        url,
      });
    }
    if (bookmarks?.children) {
      bookmarks?.children?.forEach((child) => {
        Bookmarks.getTitles(titles, child);
      });
    }
  }

  static deleteVectorFromUrl(url) {
    const indexToDelete = Bookmarks.getVectorIndexFromUrl(url);
    Bookmarks.vectorStore.memoryVectors.splice(indexToDelete, 1);
  }

  static getVectorFromUrl(url) {
    return Bookmarks.vectorStore.memoryVectors.find((mv) => mv.metadata.url === url);
  }

  static getVectorIndexFromUrl(url) {
    return Bookmarks.vectorStore.memoryVectors.findIndex((mv) => mv.metadata.url === url);
  }

  static async createBookmarkVectorStore(bookmarks) {
    Bookmarks.titles.splice(0);
    bookmarks.forEach((bookmark) => Bookmarks.getTitles(Bookmarks.titles, bookmark));

    // Create an initial version using only the immediately available data
    Bookmarks.vectorStore = await MemoryVectorStore.fromTexts(
      Bookmarks.titles
        .map(({ title, url, createdAt }) => {
          const fullUrl = new URL(url);

          return `{
                title: ${title},
                URL: ${fullUrl.hostname}${fullUrl.pathname},
                created_at: ${createdAt}
            }`;
        })
        .filter((c) => c),
      Bookmarks.titles.map(({ createdAt, url, title }, index) => ({ index, url, title, createdAt })),
      Bookmarks.embeddings
    );

    Bookmarks.setVectorStore(JSON.stringify(Bookmarks.vectorStore.memoryVectors), Bookmarks.titles.length);
    return { vectorStore: Bookmarks.vectorStore, numBookmarks: Bookmarks.titles.length };
  }

  static async updateBookmarkVectorStore(bookmarks, callback?) {
    Bookmarks.titles.splice(0);
    bookmarks.forEach((bookmark) => Bookmarks.getTitles(Bookmarks.titles, bookmark));

    const tracker = new ProgressTracker(Bookmarks.titles.length);
    Bookmarks.titles.map(({ title, url, createdAt }, index) => {
      // check if description exists or it has failed and skip
      const vectorToUpdate = Bookmarks.getVectorFromUrl(url);
      if (vectorToUpdate) {
        console.log(`Vector for url: ${url}, is already in the database.`);
        if (vectorToUpdate.metadata.description !== undefined) {
          Bookmarks.updateVectorDescription(
            { index, url, title, createdAt },
            () => tracker.updateProgress(index),
            callback
          );
          return;
        } else {
          callback(tracker.updateProgress(index));
        }
      } else {
        Bookmarks.addVector({ title, url, createdAt, index, description: undefined });
        callback(tracker.updateProgress(index));
      }
    });
  }

  static async updateVectorStoreWithDescriptions(callback?) {
    // this helps keep track of how many have been updated
    const tracker = new ProgressTracker(Bookmarks.titles.length);

    Bookmarks.titles.slice(0, 10).map(({ title, url, createdAt }, index) => {
      Bookmarks.updateVectorDescription(
        { index, url, title, createdAt },
        () => tracker.updateProgress(index),
        callback
      );
    });
  }

  static addVector({ title, url, createdAt, index, description }) {
    const fullUrl = new URL(url);
    Bookmarks.vectorStore.addDocuments([
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
        },
      },
    ]);
  }

  static async updateVectorDescription({ index, url, title, createdAt }, updateProgress?, callback?) {
    const vectorToUpdate = Bookmarks.getVectorFromUrl(url);
    // check if description exists or it has failed and skip
    if (vectorToUpdate.metadata.url.description !== undefined) {
      console.log(
        `Vector for url: ${url}, is already processed. Description ${
          vectorToUpdate.metadata.url.description ? 'was fetched' : 'was not fetched'
        }`
      );
      return;
    }

    Website.getDescription(url).then(
      (result) => {
        console.log(`Succeeded: ${url}`);

        // Delete existing vector
        Bookmarks.deleteVectorFromUrl(url);

        // Store new vector
        Bookmarks.addVector({ title, url, createdAt, index, description: true });
        callback && callback(updateProgress());
        return true;
      },
      (err) => {
        console.log(`${err?.message}: ${url} `);

        // Delete existing vector
        Bookmarks.deleteVectorFromUrl(url);

        // Store new vector
        Bookmarks.addVector({ title, url, createdAt, index, description: false });
        callback && callback(updateProgress());
        return false;
      }
    );
  }

  static async getVectorStore(): Promise<VectorStoreType | null> {
    const { vectorStore, numBookmarks } = await chrome.storage.local.get(['vectorStore', 'numBookmarks']);
    if (!numBookmarks) {
      return null;
    }

    const vectors = JSON.parse(vectorStore);
    // reconstruct MemoryVectorStore from vectors json data
    const memoryVectorStore: MemoryVectorStore = new MemoryVectorStore(Bookmarks.embeddings);

    memoryVectorStore.addVectors(
      vectors.map((x) => x.embedding),
      vectors.map((x) => {
        return {
          pageContent: x.content,
          metadata: { ...x.metadata },
        };
      })
    );

    return { vectorStore: memoryVectorStore, numBookmarks };
  }

  static async setVectorStore(vectorStore, numBookmarks) {
    return await chrome.storage.local.set({
      vectorStore,
      numBookmarks,
      updatedAt: Date.now(),
    });
  }
}