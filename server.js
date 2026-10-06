require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// View engine setup (Handlebars)
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.redirect('/books');
});

app.use('/books', bookRoutes);

// Server start
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Student: ${process.env.FULL_NAME || 'Nguyen Thi Huyen'} - MSSV: ${process.env.MSSV || '23IT110'}`);
  });
}

module.exports = app;
