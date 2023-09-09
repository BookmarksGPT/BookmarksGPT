import PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-find'));
export default class Conversations {
  static db = new PouchDB('BookmarksGPT');
  static hasIndices = Conversations.defineIndices();
  // TODO: threadId logic is not fully implemented yet.
  private threadId = self.crypto.randomUUID();
  constructor(threadId) {
    if (threadId) {
      this.threadId = threadId;
    }
    Conversations.db.destroy();
  }

  newConversation() {
    this.threadId = self.crypto.randomUUID();
    return this.threadId;
  }
  addMessage(message, type) {
    Conversations.db.post({
      message,
      type,
      threadId: this.threadId,
      timestamp: Date.now(),
    });
  }

  getMessages(timestamp?) {
    Conversations.db.find({
      selector: {
        timestamp: { $lt: timestamp || Date.now() },
      },
      sort: ['timestamp'],
      limit: 10,
    });
  }

  private static async defineIndices() {
    // TODO: Error handling
    const indices = await Conversations?.db?.getIndexes?.();
    if (indices?.indexes?.length === 1) {
      Conversations.db.createIndex({
        index: {
          fields: [
            'type',
            'timestamp',
            'threadId',
            // 'bookmarksInContext',
            // 'bookmarksInThreads',
            // 'isFirstInThread',
            // 'isLastInThread',
          ],
        },
      });
    }
  }
}
