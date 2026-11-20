require('dotenv').config();
const path = require('path');
const express = require('express');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');

const connectDB = require('./config/database');
const campRoutes = require('./routes/campRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// Set View Engine with ejs-mate for layout boilerplate
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Request Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Logging (skip during test execution)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Session configuration with MongoDB storage
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
const sessionConfig = {
  name: 'medical_camp_sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_key_medical_camp_portal_2026',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
};

app.use(session(sessionConfig));
app.use(flash());

// Global template variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.currentAdmin = req.session.adminId
    ? {
        id: req.session.adminId,
        name: req.session.adminName || 'Admin',
        role: req.session.adminRole || 'admin'
      }
    : null;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.activeNav = '';
  res.locals.pageTitle = 'Medical Camp Registration Portal';
  next();
});

// Route Handlers
app.use('/', campRoutes);
app.use('/', registrationRoutes);
app.use('/admin', adminRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server when executed directly
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Medical Camp Registration Portal is Running`);
      console.log(` Server URL : http://localhost:${PORT}`);
      console.log(` Admin URL  : http://localhost:${PORT}/admin/login`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  });
}

module.exports = app;
