// evidence/05-tests/test_session.js
require('dotenv').config();
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');

const PORT = 3004;

function startServerProcess() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(PORT) },
      cwd: process.cwd()
    });

    let started = false;

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      if (!started && text.includes('Server running on port')) {
        started = true;
        resolve(proc);
      }
    });

    proc.stderr.on('data', (chunk) => {
      // ignore normal warnings
    });

    proc.on('error', (err) => {
      if (!started) reject(err);
    });

    // Fallback timer if log doesn't match
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(proc);
      }
    }, 4000);
  });
}

async function stopServerProcess(proc) {
  if (!proc) return;
  return new Promise((resolve) => {
    proc.on('exit', () => resolve());
    proc.kill();
    setTimeout(resolve, 1000);
  });
}

async function runSessionTests() {
  console.log('====================================================');
  console.log('       REAL SESSION & STATELESS VERIFICATION        ');
  console.log('====================================================\n');

  const sessionUri = process.env.SESSION_MONGO_URI || process.env.MONGODB_WRITE_URI;
  const dbName = process.env.DB_NAME || 'DB_23IT110';
  const mongoClient = new MongoClient(sessionUri);
  await mongoClient.connect();
  const db = mongoClient.db(dbName);

  console.log(`[Atlas Connection] Connected to MongoDB Atlas DB: ${dbName}`);

  let serverProc = null;

  try {
    // ----------------------------------------------------
    // STEP 1: Start Server & First visit to /session-test
    // ----------------------------------------------------
    console.log('[Server] Starting Node.js server instance #1...');
    serverProc = await startServerProcess();
    console.log(`[Server] Instance #1 running on http://127.0.0.1:${PORT}\n`);

    console.log('--- TEST STEP A, B, C: Initial Request to /session-test ---');
    const res1 = await fetch(`http://127.0.0.1:${PORT}/session-test`);
    const cookieHeader = res1.headers.get('set-cookie');
    const data1 = await res1.json();

    console.log('Status Code:', res1.status);
    console.log('Set-Cookie Header:', cookieHeader ? cookieHeader.split(';')[0] : 'None');
    console.log('Response Body:', JSON.stringify(data1, null, 2));

    if (!data1.isNewSession || data1.sessionData.views !== 1) {
      throw new Error('Initial session creation failed!');
    }
    console.log('>> PASS: New session created successfully with student info.\n');

    const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';

    // ----------------------------------------------------
    // STEP 2: Refresh page with Cookie (Read session)
    // ----------------------------------------------------
    console.log('--- TEST STEP D: Refresh Page with Existing Cookie ---');
    const res2 = await fetch(`http://127.0.0.1:${PORT}/session-test`, {
      headers: { Cookie: cookie }
    });
    const data2 = await res2.json();

    console.log('Status Code:', res2.status);
    console.log('Response Body:', JSON.stringify(data2, null, 2));

    if (data2.isNewSession !== false || data2.sessionData.views !== 2) {
      throw new Error('Session persistence on refresh failed!');
    }
    console.log('>> PASS: Session persisted across refresh (views incremented to 2).\n');

    // ----------------------------------------------------
    // STEP 3: Verify MongoDB Atlas collection & document
    // ----------------------------------------------------
    console.log('--- TEST STEP E, F: Verify MongoDB Atlas Session Storage ---');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Collections in database:', collectionNames);

    const hasSessionsCol = collectionNames.includes('sessions');
    console.log("Collection 'sessions' exists:", hasSessionsCol);

    const sessionsCol = db.collection('sessions');
    const sessionDoc = await sessionsCol.findOne({ _id: data1.sessionId });

    if (sessionDoc) {
      const parsedSession = typeof sessionDoc.session === 'string'
        ? JSON.parse(sessionDoc.session)
        : sessionDoc.session;
      console.log('Atlas Session Document found:');
      console.log('  _id:', sessionDoc._id);
      console.log('  expires:', sessionDoc.expires);
      console.log('  session.name:', parsedSession.name);
      console.log('  session.mssv:', parsedSession.mssv);
      console.log('  session.views:', parsedSession.views);
    } else {
      throw new Error(`Session document with ID ${data1.sessionId} not found in MongoDB Atlas!`);
    }
    console.log('>> PASS: Centralized session storage confirmed in MongoDB Atlas.\n');

    // ----------------------------------------------------
    // STEP 4: Restart Server & Verify Persistence
    // ----------------------------------------------------
    console.log('--- TEST STEP G, H: Restart Node.js Server & Verify Persistence ---');
    console.log('Stopping Node.js server instance #1...');
    await stopServerProcess(serverProc);
    serverProc = null;
    console.log('Node.js server instance #1 stopped.');

    console.log('Starting fresh Node.js server instance #2...');
    serverProc = await startServerProcess();
    console.log(`Node.js server instance #2 running on http://127.0.0.1:${PORT}`);

    // Request after restart with previous cookie
    const res3 = await fetch(`http://127.0.0.1:${PORT}/session-test`, {
      headers: { Cookie: cookie }
    });
    const data3 = await res3.json();

    console.log('Status Code:', res3.status);
    console.log('Response Body:', JSON.stringify(data3, null, 2));

    if (data3.isNewSession !== false || data3.sessionData.views !== 3) {
      throw new Error('Session did not persist across server restart!');
    }
    console.log('>> PASS: Session successfully loaded from Atlas after server restart (views = 3)!\n');

    console.log('====================================================');
    console.log('       ALL PHASE 4 TESTS COMPLETED: 100% PASS       ');
    console.log('====================================================');
  } catch (err) {
    console.error('TEST ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    if (serverProc) {
      await stopServerProcess(serverProc);
    }
    await mongoClient.close();
    process.exit(process.exitCode || 0);
  }
}

runSessionTests();
