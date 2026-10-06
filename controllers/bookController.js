// controllers/bookController.js
// Skeleton controller for Book Management System

async function getBooks(req, res) {
  try {
    const fullName = process.env.FULL_NAME || 'Nguyen Thi Huyen';
    const mssv = process.env.MSSV || '23IT110';
    const vatRate = process.env.VAT_RATE || '5';

    res.render('books', {
      pageTitle: 'Book Management System',
      fullName,
      mssv,
      vatRate,
      books: []
    });
  } catch (error) {
    console.error('[BookController Error]:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function addBook(req, res) {
  res.status(501).send('Feature will be implemented in Phase 3');
}

module.exports = {
  getBooks,
  addBook
};
