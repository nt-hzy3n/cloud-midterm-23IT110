// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const { getBooks, addBook } = require('../controllers/bookController');

router.get('/', getBooks);
router.post('/add', addBook);

module.exports = router;
