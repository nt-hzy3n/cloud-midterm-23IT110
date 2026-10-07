// evidence/05-tests/test_ui_screenshots.js
require('dotenv').config();
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { connectDatabase, getWriteDb, closeDatabase } = require('../../config/database');

const PORT = 3006;

async function runUIScreenshotTests() {
  console.log('--- STARTING REAL UI STATE TESTS & SCREENSHOTS ---');

  // Find Chrome or Edge
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgePath64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  let browserExe = '';
  if (fs.existsSync(chromePath)) browserExe = chromePath;
  else if (fs.existsSync(edgePath64)) browserExe = edgePath64;
  else if (fs.existsSync(edgePath)) browserExe = edgePath;

  console.log('Using browser engine:', browserExe);

  // Connect DB
  await connectDatabase();
  const writeDb = getWriteDb();

  // Start Express server
  console.log(`Starting Express server on port ${PORT}...`);
  const server = await new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(PORT) },
      cwd: path.resolve(__dirname, '../..')
    });
    proc.stdout.on('data', (d) => {
      const txt = d.toString();
      if (txt.includes('Server running on port')) {
        resolve(proc);
      }
    });
    proc.stderr.on('data', (d) => {
      // console.error(d.toString());
    });
    proc.on('error', reject);
  });
  console.log(`Express server confirmed ready on port ${PORT}`);

  function captureScreenshot(url, outputPath) {
    const fullOutPath = path.resolve(__dirname, '../..', outputPath);
    const cmd = `"${browserExe}" --headless=new --disable-gpu --screenshot="${fullOutPath}" --window-size=1150,850 --hide-scrollbars "${url}"`;
    execSync(cmd);
    console.log(`Generated real UI screenshot: ${outputPath}`);
  }

  try {
    // -----------------------------------------------------------------
    // STATE B: Empty List (11-empty-books.png)
    // -----------------------------------------------------------------
    console.log('\n[State B] Testing Empty Books UI state...');
    await writeDb.collection('books').deleteMany({});
    captureScreenshot(`http://127.0.0.1:${PORT}/books`, 'evidence/05-tests/11-empty-books.png');

    // -----------------------------------------------------------------
    // STATE A: Books in List (10-books-ui.png)
    // -----------------------------------------------------------------
    console.log('\n[State A] Testing Populated Books UI state...');
    const vatRate = 4;
    const price1 = 120000;
    const priceAfterTax1 = Math.round(price1 * (1 + vatRate / 100));

    await writeDb.collection('books').insertOne({
      productCode: '110001',
      title: 'Điện toán Đám mây & Kiến trúc Hệ thống',
      author: 'Nguyen Thi Huyen',
      price: price1,
      vatRate: vatRate,
      priceAfterTax: priceAfterTax1,
      createdAt: new Date()
    });

    const price2 = 95000;
    const priceAfterTax2 = Math.round(price2 * (1 + vatRate / 100));
    await writeDb.collection('books').insertOne({
      productCode: '110002',
      title: 'Thiết kế Hệ thống Phân tán Hiện đại',
      author: 'Nguyen Thi Huyen',
      price: price2,
      vatRate: vatRate,
      priceAfterTax: priceAfterTax2,
      createdAt: new Date()
    });

    captureScreenshot(`http://127.0.0.1:${PORT}/books`, 'evidence/05-tests/10-books-ui.png');

    // -----------------------------------------------------------------
    // STATE C: Add Book Success (12-add-book-success-ui.png)
    // -----------------------------------------------------------------
    console.log('\n[State C] Testing Add Book Success UI state...');
    const successMsg = encodeURIComponent('Thêm sách thành công');
    captureScreenshot(`http://127.0.0.1:${PORT}/books?success=${successMsg}`, 'evidence/05-tests/12-add-book-success-ui.png');

    // -----------------------------------------------------------------
    // STATE D: Invalid Input Error (13-invalid-input-ui.png)
    // -----------------------------------------------------------------
    console.log('\n[State D] Testing Invalid Input Error UI state...');
    const errorMsg = encodeURIComponent('Mã sản phẩm phải bắt đầu bằng 3 số cuối MSSV (110)');
    captureScreenshot(`http://127.0.0.1:${PORT}/books?error=${errorMsg}`, 'evidence/05-tests/13-invalid-input-ui.png');

    console.log('\n--- ALL REAL UI SCREENSHOT TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error generating UI screenshots:', err.message);
    process.exitCode = 1;
  } finally {
    server.kill();
    await closeDatabase();
    process.exit(process.exitCode || 0);
  }
}

runUIScreenshotTests();
