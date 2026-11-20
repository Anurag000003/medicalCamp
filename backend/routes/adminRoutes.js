const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/authentication');
const { campValidationRules } = require('../validators/campValidator');

// Authentication routes
router.get('/login', forwardAuthenticated, adminController.getLogin);
router.post('/login', forwardAuthenticated, adminController.postLogin);
router.get('/logout', ensureAuthenticated, adminController.logout);

// Protected Admin Dashboard
router.get('/dashboard', ensureAuthenticated, adminController.getDashboard);

// Camp Management CRUD
router.get('/camps', ensureAuthenticated, adminController.getCamps);
router.get('/camps/new', ensureAuthenticated, adminController.getNewCampForm);
router.post('/camps', ensureAuthenticated, campValidationRules, adminController.postCreateCamp);
router.get('/camps/:id/edit', ensureAuthenticated, adminController.getEditCampForm);
router.put('/camps/:id', ensureAuthenticated, campValidationRules, adminController.putUpdateCamp);
router.delete('/camps/:id', ensureAuthenticated, adminController.deleteCamp);

// Registration Management
router.get('/registrations', ensureAuthenticated, adminController.getRegistrations);
router.post('/registrations/:id/status', ensureAuthenticated, adminController.updateRegistrationStatus);
router.post('/registrations/:id/cancel', ensureAuthenticated, adminController.cancelRegistration);

module.exports = router;
