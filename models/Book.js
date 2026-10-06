// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    trim: true
  },
  title: {
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
  vatRate: {
    type: Number,
    required: true,
    default: 5
  },
  priceAfterTax: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Helper to compile/retrieve Book model bound to a specific connection
function getBookModel(connection) {
  if (!connection) {
    throw new Error('Database connection is not initialized');
  }
  if (connection.models && connection.models['Book']) {
    return connection.models['Book'];
  }
  return connection.model('Book', bookSchema);
}

module.exports = {
  bookSchema,
  getBookModel
};
