require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const { connectDatabase } = require('./config/database');
const { configureSession } = require('./config/session');
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

// Session middleware (MongoDB Atlas store)
app.use(configureSession());

// Session test endpoint
app.get('/session-test', (req, res) => {
  if (!req.session.name) {
    req.session.name = 'Nguyen Thi Huyen';
    req.session.mssv = '23IT110';
    req.session.views = 1;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save session', details: err.message });
      }
      return res.json({
        message: 'Session created successfully',
        isNewSession: true,
        sessionId: req.sessionID,
        sessionData: {
          name: req.session.name,
          mssv: req.session.mssv,
          views: req.session.views
        }
      });
    });
  } else {
    req.session.views = (req.session.views || 1) + 1;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update session', details: err.message });
      }
      return res.json({
        message: 'Session loaded from MongoDB Atlas store',
        isNewSession: false,
        sessionId: req.sessionID,
        sessionData: {
          name: req.session.name,
          mssv: req.session.mssv,
          views: req.session.views
        }
      });
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/books');
});

app.use('/books', bookRoutes);

// Server start
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Student: ${process.env.FULL_NAME || 'Nguyen Thi Huyen'} - MSSV: ${process.env.MSSV || '23IT110'}`);
      });
    })
    .catch((err) => {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
