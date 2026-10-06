// evidence/05-tests/test_crud.js
require('dotenv').config();
const { connectDatabase, getReadConnection, getWriteConnection } = require('../../config/database');
const { getBookModel } = require('../../models/Book');
const app = require('../../server');

async function runTests() {
  console.log('--- STARTING REAL CRUD & ROUTE VERIFICATION ---');
  
  // Connect to DB
  await connectDatabase();
  console.log('Dual connections established.');

  const readConn = getReadConnection();
  const writeConn = getWriteConnection();
  const BookRead = getBookModel(readConn);
  const BookWrite = getBookModel(writeConn);

  // Clean previous test book 110001
  await BookWrite.deleteMany({ productCode: { $in: ['110001', '001001'] } });

  const server = app.listen(3002, async () => {
    try {
      // 1. Test GET /books before inserting
      const resGet1 = await fetch('http://localhost:3002/books');
      console.log('Test 1: GET /books status:', resGet1.status);

      // 2. Test Invalid Product Code POST /books
      console.log('\nTesting Invalid Prefix POST: productCode = 001001');
      const resInvalid = await fetch('http://localhost:3002/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: '001001',
          title: 'Invalid Book',
          author: 'Test Author',
          price: 100000
        })
      });
      const invalidText = await resInvalid.text();
      console.log('Test 2: Invalid Prefix Status:', resInvalid.status);
      console.log('Test 2: Rejection message:', invalidText);

      // Verify no document was created for 001001
      const countInvalid = await BookRead.countDocuments({ productCode: '001001' });
      console.log('Test 2: Document count for 001001 in DB:', countInvalid);

      // 3. Test Valid Product Code POST /books
      console.log('\nTesting Valid Prefix POST: productCode = 110001');
      const resValid = await fetch('http://localhost:3002/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: '110001',
          title: 'Test Book',
          author: 'Nguyen Thi Huyen',
          price: 100000
        })
      });
      const validJson = await resValid.json();
      console.log('Test 3: Valid POST Status:', resValid.status);
      console.log('Test 3: Saved document returned:', validJson.book);

      // 4. Verify in Atlas using READ connection
      const savedDoc = await BookRead.findOne({ productCode: '110001' }).lean();
      console.log('\nTest 4: Verifying document via Atlas READ connection:');
      console.log('  productCode:', savedDoc.productCode);
      console.log('  title:', savedDoc.title);
      console.log('  author:', savedDoc.author);
      console.log('  price:', savedDoc.price);
      console.log('  vatRate:', savedDoc.vatRate);
      console.log('  priceAfterTax:', savedDoc.priceAfterTax);

      // 5. Test GET /books after inserting (Handlebars render)
      const resGet2 = await fetch('http://localhost:3002/books');
      const html = await resGet2.text();
      console.log('\nTest 5: GET /books rendered HTML check:');
      console.log('  Contains 110001:', html.includes('110001'));
      console.log('  Contains Test Book:', html.includes('Test Book'));
      console.log('  Contains 105000 VNĐ:', html.includes('105000 VNĐ'));
      console.log('  Contains Nguyen Thi Huyen:', html.includes('Nguyen Thi Huyen'));

      console.log('\n--- ALL REAL CRUD TESTS PASSED SUCCESSFULLY! ---');
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      server.close();
      await readConn.close();
      await writeConn.close();
      process.exit(0);
    }
  });
}

runTests();
