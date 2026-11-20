const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { registrationValidationRules } = require('../validators/registrationValidator');

// Registration workflow
router.get('/register', registrationController.getRegistrationForm);
router.post('/register', registrationValidationRules, registrationController.postRegistration);

// Registration confirmation pass
router.get('/registrations/confirmation/:reference', registrationController.getConfirmationPage);

// Registration search and lookup
router.get('/registrations/lookup', registrationController.getLookupPage);
router.post('/registrations/lookup', registrationController.postLookup);

module.exports = router;
