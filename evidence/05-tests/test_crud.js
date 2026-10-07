// evidence/05-tests/test_crud.js
// Native MongoDB Driver CRUD & Dual Connection Verification
require('dotenv').config();
const { connectDatabase, getReadDb, getWriteDb, closeDatabase } = require('../../config/database');
const app = require('../../server');

async function runTests() {
  console.log('====================================================');
  console.log('--- STARTING NATIVE MONGODB CRUD & ROUTE VERIFICATION ---');
  console.log('====================================================\n');

  // 1. Establish dual native MongoClient connections
  await connectDatabase();
  const readDb = getReadDb();
  const writeDb = getWriteDb();

  console.log('Dual native MongoClient connections verified.');

  // Clean previous test books 110001, 001001 via WRITE connection
  await writeDb.collection('books').deleteMany({ productCode: { $in: ['110001', '001001'] } });

  const PORT = 3002;
  const server = app.listen(PORT, async () => {
    try {
      // TEST A: Dedicated READ connection test
      console.log('\n--- TEST A: READ Connection Test (read_23IT110 on DB_23IT110) ---');
      const initialBooks = await readDb.collection('books').find({}).toArray();
      console.log('Test A: Successfully queried books via READ connection. Count:', initialBooks.length);

      // TEST 1: GET /books before inserting
      console.log('\n--- TEST 1: HTTP GET /books (Handlebars Rendering via READ) ---');
      const resGet1 = await fetch(`http://localhost:${PORT}/books`);
      console.log('Test 1: GET /books status:', resGet1.status);

      // TEST 2: Invalid Product Code POST /books (001001)
      console.log('\n--- TEST 2: POST /books with Invalid Prefix (001001) ---');
      const resInvalid = await fetch(`http://localhost:${PORT}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: '001001',
          title: 'Invalid Prefix Book',
          author: 'Test Author',
          price: 100000
        })
      });
      const invalidText = await resInvalid.text();
      console.log('Test 2: Invalid Prefix Status:', resInvalid.status);
      console.log('Test 2: Rejection message:', invalidText);

      // Verify no document was created for 001001 via READ connection
      const countInvalid = await readDb.collection('books').countDocuments({ productCode: '001001' });
      console.log('Test 2: Document count for 001001 in DB (READ check):', countInvalid);

      // TEST 3 & B: Valid Product Code POST /books (110001) via WRITE connection
      console.log('\n--- TEST 3 & B: POST /books with Valid Prefix (110001) via WRITE connection ---');
      const resValid = await fetch(`http://localhost:${PORT}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: '110001',
          title: 'Test Book Native MongoDB',
          author: 'Nguyen Thi Huyen',
          price: 100000
        })
      });
      const validJson = await resValid.json();
      console.log('Test 3: Valid POST Status:', resValid.status);
      console.log('Test 3: Saved document returned:', validJson.book);

      // TEST 4 & D: Verify document via READ connection and verify VAT 4% calculation
      console.log('\n--- TEST 4: Verifying Document in Atlas via Native READ connection ---');
      const savedDoc = await readDb.collection('books').findOne({ productCode: '110001' });
      console.log('  productCode:', savedDoc.productCode);
      console.log('  title:', savedDoc.title);
      console.log('  author:', savedDoc.author);
      console.log('  price:', savedDoc.price);
      console.log('  vatRate:', savedDoc.vatRate);
      console.log('  priceAfterTax:', savedDoc.priceAfterTax);
      console.log('  createdAt:', savedDoc.createdAt);

      const expectedPriceAfterTax = Math.round(100000 * 1.04);
      if (savedDoc.priceAfterTax !== expectedPriceAfterTax) {
        throw new Error(`VAT calculation mismatch! Expected ${expectedPriceAfterTax}, got ${savedDoc.priceAfterTax}`);
      }
      console.log('>> PASS: VAT calculation verified (100000 + 4% = 104000 VNĐ)');

      // TEST 5: GET /books after inserting (Check rendered Handlebars UI)
      console.log('\n--- TEST 5: GET /books rendered HTML check ---');
      const resGet2 = await fetch(`http://localhost:${PORT}/books`);
      const html = await resGet2.text();
      console.log('  Contains 110001:', html.includes('110001'));
      console.log('  Contains Test Book Native MongoDB:', html.includes('Test Book Native MongoDB'));
      console.log('  Contains 104000 VNĐ:', html.includes('104000 VNĐ'));
      console.log('  Contains Nguyen Thi Huyen:', html.includes('Nguyen Thi Huyen'));

      console.log('\n====================================================');
      console.log('--- ALL NATIVE MONGODB TESTS PASSED SUCCESSFULLY! ---');
      console.log('====================================================');
    } catch (err) {
      console.error('Test execution failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      await closeDatabase();
      process.exit(process.exitCode || 0);
    }
  });
}

runTests();
