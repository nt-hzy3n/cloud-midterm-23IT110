// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const { getBooks, addBook } = require('../controllers/bookController');

// Route for reading books (READ connection)
router.get('/', getBooks);

// Routes for creating books (WRITE connection)
router.post('/', addBook);
router.post('/add', addBook);

module.exports = router;
