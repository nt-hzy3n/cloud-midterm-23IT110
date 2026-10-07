// models/Book.js
// Native MongoDB document helpers

function validateBookInput(data, prefix = '110') {
  const { productCode, title, name, author, price } = data;
  const bookTitle = title || name;

  // 1. Validate Product Code prefix server-side
  if (!productCode || typeof productCode !== 'string' || !productCode.startsWith(prefix)) {
    return {
      valid: false,
      error: `Mã sản phẩm phải bắt đầu bằng 3 số cuối MSSV (${prefix})`
    };
  }

  // 2. Validate book details
  const numericPrice = Number(price);
  if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return { valid: false, error: 'Thông tin sách không hợp lệ' };
  }
  if (!author || typeof author !== 'string' || !author.trim()) {
    return { valid: false, error: 'Thông tin sách không hợp lệ' };
  }
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return { valid: false, error: 'Thông tin sách không hợp lệ' };
  }

  return {
    valid: true,
    data: {
      productCode: productCode.trim(),
      title: bookTitle.trim(),
      author: author.trim(),
      price: numericPrice
    }
  };
}

function createBookDocument({ productCode, title, author, price, vatRate = 4 }) {
  const numericPrice = Number(price);
  const numericVat = Number(vatRate);
  const priceAfterTax = Math.round(numericPrice * (1 + numericVat / 100));

  return {
    productCode: String(productCode).trim(),
    title: String(title).trim(),
    author: String(author).trim(),
    price: numericPrice,
    vatRate: numericVat,
    priceAfterTax,
    createdAt: new Date()
  };
}

module.exports = {
  validateBookInput,
  createBookDocument
};
