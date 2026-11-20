const express = require('express');
const router = express.Router();
const campController = require('../controllers/campController');

// Home & informational routes
router.get('/', campController.getHomePage);
router.get('/about', campController.getAboutPage);
router.get('/contact', campController.getContactPage);
router.post('/contact', campController.postContact);

// Camp listing and single details
router.get('/camps', campController.getAllCamps);
router.get('/camps/:id', campController.getCampDetails);

module.exports = router;
