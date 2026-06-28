import { Platform } from 'react-native';

let db = null;
if (Platform.OS !== 'web') {
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('travhub.db');
}

export const databaseService = {
  /**
   * Initializes the database tables if they do not exist.
   * We store stringified JSON for complex fields like participantDetails.
   */
  initDatabase: () => {
    if (Platform.OS === 'web' || !db) return;
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          participants TEXT,
          participantDetails TEXT,
          lastMessage TEXT,
          lastSender TEXT,
          updatedAt TEXT,
          unread INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          chatId TEXT,
          text TEXT,
          sender TEXT,
          createdAt TEXT,
          type TEXT,
          mediaUrl TEXT,
          mediaType TEXT,
          isEdited INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS key_value (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      
      // Try adding unreadCount column if it doesn't exist
      try {
        db.execSync("ALTER TABLE chats ADD COLUMN unreadCount INTEGER DEFAULT 0;");
      } catch (e) {
        // Column probably already exists
      }

      // Try adding isEdited column if it doesn't exist
      try {
        db.execSync("ALTER TABLE messages ADD COLUMN isEdited INTEGER DEFAULT 0;");
      } catch (e) {
        // Column probably already exists
      }

      // Try adding read, received, time columns
      try { db.execSync("ALTER TABLE messages ADD COLUMN read INTEGER DEFAULT 0;"); } catch (e) {}
      try { db.execSync("ALTER TABLE messages ADD COLUMN received INTEGER DEFAULT 0;"); } catch (e) {}
      try { db.execSync("ALTER TABLE messages ADD COLUMN time TEXT;"); } catch (e) {}

      console.log('SQLite database initialized.');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
    }
  },

  /**
   * Saves a list of chats to the SQLite database.
   * Useful for syncing the "chats list" from Firebase.
   */
  saveChats: (chatsList) => {
    if (Platform.OS === 'web' || !db) return;
    try {
      const statement = db.prepareSync(
        `INSERT OR REPLACE INTO chats (id, participants, participantDetails, lastMessage, lastSender, updatedAt, unread, unreadCount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const chat of chatsList) {
        statement.executeSync([
          chat.id,
          JSON.stringify(chat.participants || []),
          JSON.stringify(chat.participantDetails || {}),
          chat.lastMessage || '',
          chat.lastSender || '',
          chat.updatedAt || '',
          chat.unread ? 1 : 0,
          chat.unreadCount || 0
        ]);
      }
    } catch (error) {
      console.error('Error saving chats to SQLite:', error);
    }
  },

  /**
   * Retrieves all active chats from SQLite, ordered by most recently updated.
   */
  getAllChats: () => {
    if (Platform.OS === 'web' || !db) return [];
    try {
      const result = db.getAllSync('SELECT * FROM chats ORDER BY updatedAt DESC');
      return result.map(row => ({
        ...row,
        participants: JSON.parse(row.participants || '[]'),
        participantDetails: JSON.parse(row.participantDetails || '{}'),
        unread: row.unread === 1,
        unreadCount: row.unreadCount || 0
      }));
    } catch (error) {
      console.error('Error retrieving chats from SQLite:', error);
      return [];
    }
  },

  /**
   * Saves individual messages for a specific chat.
   */
  saveMessages: (messagesList) => {
    if (Platform.OS === 'web' || !db) return;
    try {
      const statement = db.prepareSync(
        `INSERT OR REPLACE INTO messages (id, chatId, text, sender, createdAt, type, mediaUrl, mediaType, isEdited, read, received, time) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const msg of messagesList) {
        statement.executeSync([
          msg.id,
          msg.chatId,
          msg.text || '',
          msg.sender,
          msg.createdAt || '',
          msg.type || 'text',
          msg.mediaUrl || '',
          msg.mediaType || '',
          msg.isEdited ? 1 : 0,
          msg.read ? 1 : 0,
          msg.received ? 1 : 0,
          msg.time || ''
        ]);
      }
    } catch (error) {
      console.error('Error saving messages to SQLite:', error);
    }
  },

  /**
   * Retrieves messages for a specific chat, ordered by creation time descending (newest first).
   */
  getMessagesForChat: (chatId, limit = 50, offset = 0) => {
    if (Platform.OS === 'web' || !db) return [];
    try {
      const result = db.getAllSync(
        'SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [chatId, limit, offset]
      );
      return result.map(row => ({
        ...row,
        isEdited: row.isEdited === 1,
        read: row.read === 1,
        received: row.received === 1
      }));
    } catch (error) {
      console.error('Error retrieving messages from SQLite:', error);
      return [];
    }
  },

  /**
   * Deletes specific messages from the local database
   */
  deleteMessages: (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    try {
      const statement = db.prepareSync('DELETE FROM messages WHERE id = ?');
      for (const id of messageIds) {
        statement.executeSync([id]);
      }
    } catch (error) {
      console.error('Error deleting messages from SQLite:', error);
    }
  },
  
  /**
   * Deletes all local data. Useful for logout.
   */
  clearDatabase: () => {
    if (Platform.OS === 'web' || !db) {
      try { localStorage.clear(); } catch(e){}
      return;
    }
    try {
      db.execSync(`
        DELETE FROM chats;
        DELETE FROM messages;
        DELETE FROM key_value;
      `);
    } catch (error) {
      console.error('Error clearing SQLite database:', error);
    }
  },

  /**
   * Key-Value Store: Set Item
   */
  setItem: (key, value) => {
    if (Platform.OS === 'web' || !db) {
      try { localStorage.setItem(key, value); } catch(e){}
      return;
    }
    try {
      const statement = db.prepareSync('INSERT OR REPLACE INTO key_value (key, value) VALUES (?, ?)');
      statement.executeSync([key, String(value)]);
    } catch (error) {
      console.error('SQLite setItem error:', error);
    }
  },

  /**
   * Key-Value Store: Get Item
   */
  getItem: (key) => {
    if (Platform.OS === 'web' || !db) {
      try { return localStorage.getItem(key); } catch(e){ return null; }
    }
    try {
      const result = db.getFirstSync('SELECT value FROM key_value WHERE key = ?', [key]);
      return result ? result.value : null;
    } catch (error) {
      console.error('SQLite getItem error:', error);
      return null;
    }
  },

  /**
   * Key-Value Store: Remove Item
   */
  removeItem: (key) => {
    try {
      db.execSync(`DELETE FROM key_value WHERE key = '${key}'`);
    } catch (error) {
      console.error('SQLite removeItem error:', error);
    }
  }
};

// Auto-initialize on import
databaseService.initDatabase();
