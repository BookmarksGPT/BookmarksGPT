class idb {
  private db: IDBDatabase | undefined; // Declare the db property

  constructor() {
    this.initializeDb();
  }

  storeDocument(documentData) {
    if (this.db) {
      const transaction = this.db.transaction(['documents'], 'readwrite');
      const objectStore = transaction.objectStore('documents');
      const request = objectStore.add(documentData);

      request.onsuccess = function (event) {
        console.log('Document stored with ID:', (event.target as IDBOpenDBRequest).result);
      };

      request.onerror = function (event) {
        console.error('Error retrieving document:', (event.target as IDBOpenDBRequest).error);
      };
    }
  }

  getDocumentById(id) {
    if (this.db) {
      const transaction = this.db.transaction(['documents']);
      const objectStore = transaction.objectStore('documents');
      const request = objectStore.get(id);

      request.onsuccess = function (event) {
        if (request.result) {
          console.log('Document:', request.result);
        } else {
          console.log('No document found with ID:', id);
        }
      };

      request.onerror = function (event) {
        console.error('Error retrieving document:', (event.target as IDBOpenDBRequest).error);
      };
    }
  }

  deleteDocumentById(id) {
    if (this.db) {
      const transaction = this.db.transaction(['documents'], 'readwrite');
      const objectStore = transaction.objectStore('documents');
      const request = objectStore.delete(id);

      request.onsuccess = function (event) {
        console.log('Document deleted successfully.');
      };

      request.onerror = function (event) {
        console.error('Error opening database:', (event.target as IDBOpenDBRequest).error);
      };
    }
  }

  private initializeDb(): void {
    // Open (or create) the database
    const request = indexedDB.open('BGPT_VectorStore_DB', 1);

    const _db = this.db;
    // This event is only implemented in recent browsers
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      this.db = (event.target as IDBOpenDBRequest).result as IDBDatabase;

      // Create an object store named "documents" with a keyPath of "id" and autoIncrement set to true
      const objectStore = this.db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
    };

    request.onerror = (event: Event) => {
      const error = (event.target as IDBRequest).error;
      console.error('Error opening database:', error);
    };

    request.onsuccess = (event: Event) => {
      const result = (event.target as IDBRequest).result;
      this.db = result;
    };
  }
}
