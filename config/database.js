// config/database.js
const mongoose = require('mongoose');

let readDB = null;
let writeDB = null;

async function connectDatabase() {
  const dbName = process.env.DB_NAME || 'DB_23IT110';
  const readURI = process.env.MONGODB_READ_URI;
  const writeURI = process.env.MONGODB_WRITE_URI;

  if (!readURI || !writeURI) {
    throw new Error('Missing MONGODB_READ_URI or MONGODB_WRITE_URI in environment variables');
  }

  // Independent READ connection
  readDB = mongoose.createConnection(readURI, {
    dbName: dbName
  });

  readDB.on('connected', () => {
    console.log(`[Read Connection] Connected successfully to database: ${dbName}`);
  });

  readDB.on('error', (err) => {
    console.error('[Read Connection] Error connecting to database:', err.message);
  });

  // Independent WRITE connection
  writeDB = mongoose.createConnection(writeURI, {
    dbName: dbName
  });

  writeDB.on('connected', () => {
    console.log(`[Write Connection] Connected successfully to database: ${dbName}`);
  });

  writeDB.on('error', (err) => {
    console.error('[Write Connection] Error connecting to database:', err.message);
  });

  await Promise.all([
    readDB.asPromise(),
    writeDB.asPromise()
  ]);

  return { readDB, writeDB };
}

function getReadConnection() {
  return readDB;
}

function getWriteConnection() {
  return writeDB;
}

module.exports = {
  connectDatabase,
  getReadConnection,
  getWriteConnection,
  getReadDB: getReadConnection,
  getWriteDB: getWriteConnection
};
