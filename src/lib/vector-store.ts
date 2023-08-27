import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Summarization } from './summarization.ts';

interface VectorStoreType {
  vectorStore: MemoryVectorStore;
  numBookmarks: number;
}

export class VectorStore {
  constructor() {}

  static async getTitles(titles, bookmarks) {
    const { title, type, dateAdded, url } = bookmarks || {};
    if (title && url) {
      const description = await Summarization.getWebsiteDescription(url);

      titles.push({
        title,
        createdAt: dateAdded,
        url: description.url,
        description: description.description,
      });
    }
    if (bookmarks?.children) {
      bookmarks?.children?.forEach((child) => {
        VectorStore.getTitles(titles, child);
      });
    }
  }

  static async createBookmarkVectorStore(bookmarks) {
    const titles = [];
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    bookmarks.forEach((bookmark) => VectorStore.getTitles(titles, bookmark));

    const vectorStore = await MemoryVectorStore.fromTexts(
      titles.map(
        ({ title, description }) => `Bookmarked website or webpage\n\ntitle: ${title}\n\ndescription: ${description}`
      ),
      titles.map(({ createdAt, url }, index) => ({ index, url, createdAt })),
      embeddings
    );
    VectorStore.set(JSON.stringify(vectorStore.memoryVectors), titles.length);
    return { vectorStore, numBookmarks: titles.length };
  }

  static async get(): Promise<VectorStoreType> {
    const { vectorStore, numBookmarks } = await chrome.storage.local.get(['vectorStore', 'numBookmarks']);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectors = JSON.parse(vectorStore);
    // recover MemoryVectorStore from vectors json data
    const memoryVectorStore: MemoryVectorStore = new MemoryVectorStore(embeddings);

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

  static async set(vectorStore, numBookmarks) {
    return await chrome.storage.local.set({
      vectorStore,
      numBookmarks,
      updatedAt: Date.now(),
    });
  }
}
