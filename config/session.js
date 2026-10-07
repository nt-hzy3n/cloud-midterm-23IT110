// config/session.js
const session = require('express-session');
const connectMongo = require('connect-mongo');

// Support CommonJS interoperability for connect-mongo
const MongoStore = connectMongo.create
  ? connectMongo
  : (connectMongo.default || connectMongo.MongoStore || connectMongo);

function configureSession() {
  const sessionSecret = process.env.SESSION_SECRET;
  const sessionMongoUri = process.env.SESSION_MONGO_URI || process.env.MONGODB_WRITE_URI;
  const dbName = process.env.DB_NAME || 'DB_23IT110';

  if (!sessionSecret) {
    throw new Error('Missing SESSION_SECRET in environment variables');
  }

  if (!sessionMongoUri) {
    throw new Error('Missing SESSION_MONGO_URI or MONGODB_WRITE_URI in environment variables');
  }

  // Centralized session storage on MongoDB Atlas
  const store = MongoStore.create({
    mongoUrl: sessionMongoUri,
    dbName: dbName,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native'
  });

  store.on('error', (err) => {
    console.error('[Session Store] MongoStore Error:', err.message);
  });

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  });
}

module.exports = { configureSession };
