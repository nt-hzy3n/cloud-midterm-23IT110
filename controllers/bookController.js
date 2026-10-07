// controllers/bookController.js
const { getReadDb, getWriteDb } = require('../config/database');
const { validateBookInput, createBookDocument } = require('../models/Book');

// GET /books - Uses READ connection only
async function getBooks(req, res) {
  try {
    const fullName = process.env.FULL_NAME || 'Nguyen Thi Huyen';
    const mssv = process.env.MSSV || '23IT110';
    const vatRate = process.env.VAT_RATE !== undefined ? Number(process.env.VAT_RATE) : (Number(mssv.slice(-1)) + 4);

    // Explicitly query through READ connection
    const readDb = getReadDb();
    if (!readDb) {
      throw new Error('READ database connection is not ready');
    }

    // Native MongoDB collection find and toArray()
    const books = await readDb
      .collection('books')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.render('books', {
      pageTitle: 'Book Management System',
      fullName,
      mssv,
      vatRate,
      books,
      error: req.query.error,
      success: req.query.success
    });
  } catch (error) {
    console.error('[BookController Error - Read]:', error.message);
    res.status(500).send('Lỗi đọc dữ liệu: ' + error.message);
  }
}

// POST /books - Uses WRITE connection only
async function addBook(req, res) {
  try {
    const mssv = process.env.MSSV || '23IT110';
    const prefix = process.env.PRODUCT_PREFIX || mssv.slice(-3); // '110'
    const vatRate = process.env.VAT_RATE !== undefined ? Number(process.env.VAT_RATE) : (Number(mssv.slice(-1)) + 4); // 4%

    // 1. Validation using helper
    const validation = validateBookInput(req.body, prefix);
    if (!validation.valid) {
      if (req.xhr || req.headers['content-type']?.includes('application/json')) {
        return res.status(400).send(validation.error);
      }
      return res.redirect('/books?error=' + encodeURIComponent(validation.error));
    }

    const { productCode, title, author, price } = validation.data;

    // 2. Format book document with VAT calculation
    const bookDocument = createBookDocument({
      productCode,
      title,
      author,
      price,
      vatRate
    });

    // 3. Explicitly insert through WRITE connection only
    const writeDb = getWriteDb();
    if (!writeDb) {
      throw new Error('WRITE database connection is not ready');
    }

    const result = await writeDb.collection('books').insertOne(bookDocument);
    const savedBook = { ...bookDocument, _id: result.insertedId, id: result.insertedId.toString() };

    // Check if client expects JSON (e.g., API test) or standard HTML form submit
    if (req.xhr || req.headers['content-type']?.includes('application/json')) {
      return res.status(201).json({
        message: 'Thêm sách thành công',
        book: savedBook
      });
    }

    return res.redirect('/books?success=' + encodeURIComponent('Thêm sách thành công'));
  } catch (error) {
    console.error('[BookController Error - Write]:', error.message);
    res.status(500).send('Không thể thêm sách: ' + error.message);
  }
}

module.exports = {
  getBooks,
  addBook
};
