const Admin = require('../models/Admin');

/**
 * Middleware to protect routes that require admin authentication
 */
const ensureAuthenticated = async (req, res, next) => {
  if (req.session && req.session.adminId) {
    try {
      const admin = await Admin.findById(req.session.adminId).select('-password');
      if (!admin) {
        req.session.destroy();
        req.flash('error_msg', 'Admin session expired. Please log in again.');
        return res.redirect('/admin/login');
      }
      res.locals.currentAdmin = {
        id: admin._id,
        name: admin.fullName || admin.username || 'Admin',
        fullName: admin.fullName || 'Admin',
        username: admin.username,
        role: admin.role
      };
      return next();
    } catch (err) {
      return next(err);
    }
  }

  // Store return URL
  req.session.returnTo = req.originalUrl;
  req.flash('error_msg', 'Please log in to access the administrator panel.');
  res.redirect('/admin/login');
};

/**
 * Middleware to redirect already authenticated admins away from login page
 */
const forwardAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  ensureAuthenticated,
  forwardAuthenticated
};
