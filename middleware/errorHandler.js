const mongoose = require('mongoose');

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).render('404', {
    pageTitle: '404 - Page Not Found',
    path: req.originalUrl,
    message: 'The page or medical camp resource you are looking for does not exist or has been moved.'
  });
};

/**
 * Global Error Handler Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError || err.name === 'CastError') {
    if (req.accepts('html')) {
      req.flash('error_msg', 'The requested record identifier is invalid.');
      return res.status(404).render('404', {
        pageTitle: 'Record Not Found',
        path: req.originalUrl,
        message: 'The requested resource identifier is invalid or could not be found.'
      });
    }
    return res.status(404).json({ success: false, message: 'Invalid resource ID' });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    if (req.accepts('html')) {
      req.flash('error_msg', messages.join('. '));
      return res.redirect('back');
    }
    return res.status(400).json({ success: false, errors: messages });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (req.accepts('html')) {
    return res.status(statusCode).render('error', {
      pageTitle: `Error ${statusCode}`,
      statusCode,
      message: isProduction && statusCode === 500 ? 'An unexpected server error occurred. Please try again later.' : err.message,
      error: isProduction ? {} : err
    });
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'An unexpected internal server error occurred.' : err.message
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
