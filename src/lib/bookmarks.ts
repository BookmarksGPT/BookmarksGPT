import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Website } from './website.ts';
import PouchDB from 'pouchdb';

interface VectorStoreType {
  vectorStore: MemoryVectorStore;
  numBookmarks: number;
}

// TODO: DO NOT RETRY FAILED
// init db first time (same as full reset - this will eventually go in settings)
// add new bookmark
// update db with new stuff & fetch missing (and empty) descriptions || add new button for testing for now

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

interface VectorDocument {
  vector: any;
}

export class Bookmarks {
  static db = new PouchDB<VectorDocument>('BookmarksGPTVectors', {
    auto_compaction: true,
  });
  static embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  static vectorStore;
  static titles = [];
  constructor() {}

  private static getTitles(titles, bookmarks) {
    const { id, title, dateAdded, url } = bookmarks || {};
    if (title && url) {
      titles.push({
        id,
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
        .map(({ id, title, url, createdAt }) => {
          const fullUrl = new URL(url);

          return `{
                title: ${title},
                URL: ${fullUrl.hostname}${fullUrl.pathname},
                created_at: ${createdAt}
            }`;
        })
        .filter((c) => c),
      Bookmarks.titles.map(({ id, createdAt, url, title }, index) => ({ id, index, url, title, createdAt })),
      Bookmarks.embeddings
    );

    const res = await Bookmarks.setVectorStore();
    const allDocs = await Bookmarks.db.allDocs();
    Bookmarks.setVectorStore();
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
        Bookmarks.addVector({ title, url, createdAt, index, description: undefined, fetchFailed: false });
        callback(tracker.updateProgress(index));
      }
    });
  }

  static async updateVectorStoreWithDescriptions(callback?) {
    // this helps keep track of how many have been updated
    const tracker = new ProgressTracker(Bookmarks.titles.length);

    Bookmarks.titles.map(({ title, url, createdAt }, index) => {
      Bookmarks.updateVectorDescription(
        { index, url, title, createdAt },
        () => tracker.updateProgress(index),
        callback
      );
    });
  }

  static addVector({ title, url, createdAt, index, description, fetchFailed }) {
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
          fetchFailed,
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
          vectorToUpdate.metadata.description ? 'was fetched' : 'was not fetched'
        }`
      );
      return;
    }

    if (vectorToUpdate.metadata.description !== undefined) {
    }

    Website.getDescription(url)
      .then((description) => {
        console.log(`Succeeded: ${url}`);

        // Delete existing vector
        Bookmarks.deleteVectorFromUrl(url);

        // Store new vector
        Bookmarks.addVector({ title, url, createdAt, index, description, fetchFailed: false });
        callback && callback(updateProgress());
        return true;
      })
      .catch((err) => {
        console.log(`${err?.message}: ${url} `);

        // Delete existing vector
        Bookmarks.deleteVectorFromUrl(url);

        // Store new vector
        Bookmarks.addVector({ title, url, createdAt, index, description: undefined, fetchFailed: true });
        callback && callback(updateProgress());
        return false;
      });
  }

  static async getVectorStore(): Promise<VectorStoreType | null> {
    const vectors =
      (await Bookmarks.db.allDocs({ include_docs: true })).rows.map((row) => ({ ...row?.doc?.vector })) || [];
    const allDocs = await Bookmarks.db.allDocs({ include_docs: true });
    const vectors = allDocs.rows.map((row) => ({ ...row?.doc?.vector })) || [];

    if (vectors.length === 0) {
      return null;
    }

    // reconstruct MemoryVectorStore
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

    return { vectorStore: memoryVectorStore, numBookmarks: vectors.length };
  }

  static setVectorStore() {
    if (!Bookmarks.vectorStore) return;
    return await Promise.allSettled(
      Bookmarks.vectorStore.memoryVectors.map((vector) => Bookmarks.db.put({ _id: vector.metadata.id, vector }))
    return Promise.allSettled(
      Bookmarks.vectorStore.memoryVectors.map((vector) => Bookmarks.db.put({ _id: vector.metadata.url, vector }))
    );
  }

  static async getBySimilarity(searchString) {
    const result = await Bookmarks.vectorStore.similaritySearchWithScore(searchString, 100);
    return result.filter((m) => m[1] > 0.76);
  }
}
