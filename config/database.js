// config/database.js
const { MongoClient } = require('mongodb');

let readClient = null;
let writeClient = null;
let readDb = null;
let writeDb = null;

async function connectDatabase() {
  const dbName = process.env.DB_NAME || 'DB_23IT110';
  const readURI = process.env.MONGODB_READ_URI;
  const writeURI = process.env.MONGODB_WRITE_URI;

  if (!readURI || !writeURI) {
    throw new Error('Missing MONGODB_READ_URI or MONGODB_WRITE_URI in environment variables');
  }

  try {
    // 1. Independent READ client
    readClient = new MongoClient(readURI);
    await readClient.connect();
    readDb = readClient.db(dbName);
    console.log(`[Read Connection] READ database connected: ${dbName}`);

    // 2. Independent WRITE client
    writeClient = new MongoClient(writeURI);
    await writeClient.connect();
    writeDb = writeClient.db(dbName);
    console.log(`[Write Connection] WRITE database connected: ${dbName}`);

    return { readClient, writeClient, readDb, writeDb };
  } catch (error) {
    console.error('[Database Connection Error]:', error.message);
    throw error;
  }
}

function getReadDb() {
  return readDb;
}

function getWriteDb() {
  return writeDb;
}

function getReadClient() {
  return readClient;
}

function getWriteClient() {
  return writeClient;
}

async function closeDatabase() {
  if (readClient) {
    await readClient.close();
    readClient = null;
    readDb = null;
  }
  if (writeClient) {
    await writeClient.close();
    writeClient = null;
    writeDb = null;
  }
}

module.exports = {
  connectDatabase,
  getReadDb,
  getWriteDb,
  getReadClient,
  getWriteClient,
  closeDatabase,
  // Compatibility aliases
  getReadConnection: getReadDb,
  getWriteConnection: getWriteDb
};
