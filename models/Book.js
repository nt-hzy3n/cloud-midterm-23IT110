// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceAfterTax: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = bookSchema;
