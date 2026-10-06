// controllers/bookController.js
const { getReadConnection, getWriteConnection } = require('../config/database');
const { getBookModel } = require('../models/Book');

// GET /books - Uses READ connection only
async function getBooks(req, res) {
  try {
    const fullName = process.env.FULL_NAME || 'Nguyen Thi Huyen';
    const mssv = process.env.MSSV || '23IT110';
    const vatRate = Number(process.env.VAT_RATE) || (Number(mssv.slice(-1)) + 5);

    // Explicitly query through READ connection
    const readConnection = getReadConnection();
    if (!readConnection) {
      throw new Error('READ database connection is not ready');
    }

    const BookRead = getBookModel(readConnection);
    const books = await BookRead.find().sort({ createdAt: -1 }).lean();

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
    const { productCode, title, name, author, price } = req.body;
    const bookTitle = title || name;

    const mssv = process.env.MSSV || '23IT110';
    const prefix = process.env.PRODUCT_PREFIX || mssv.slice(-3); // '110'
    const vatRate = Number(process.env.VAT_RATE) || (Number(mssv.slice(-1)) + 5); // 5%

    // 1. Validate Product Code prefix server-side
    if (!productCode || !productCode.startsWith(prefix)) {
      return res.status(400).send(`Mã sản phẩm phải bắt đầu bằng 3 số cuối MSSV (${prefix})`);
    }

    // 2. Validate book information
    const numericPrice = Number(price);
    if (!bookTitle || !author || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).send('Thông tin sách không hợp lệ');
    }

    // 3. Dynamic VAT calculation server-side
    const priceAfterTax = Math.round(numericPrice * (1 + vatRate / 100));

    // 4. Explicitly insert through WRITE connection
    const writeConnection = getWriteConnection();
    if (!writeConnection) {
      throw new Error('WRITE database connection is not ready');
    }

    const BookWrite = getBookModel(writeConnection);
    const savedBook = await BookWrite.create({
      productCode,
      title: bookTitle,
      author,
      price: numericPrice,
      vatRate,
      priceAfterTax
    });

    // Check if client expects JSON (e.g., API test) or standard HTML form submit
    if (req.xhr || req.headers['content-type']?.includes('application/json')) {
      return res.status(201).json({
        message: 'Thêm sách thành công',
        book: savedBook
      });
    }

    return res.redirect('/books');
  } catch (error) {
    console.error('[BookController Error - Write]:', error.message);
    res.status(500).send('Không thể thêm sách: ' + error.message);
  }
}

module.exports = {
  getBooks,
  addBook
};
