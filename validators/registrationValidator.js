const { body } = require('express-validator');
const mongoose = require('mongoose');

const registrationValidationRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Full name can only contain letters, spaces, dots, and hyphens.'),

  body('age')
    .notEmpty().withMessage('Age is required.')
    .isInt({ min: 1, max: 120 }).withMessage('Age must be a valid number between 1 and 120.'),

  body('contactNumber')
    .trim()
    .notEmpty().withMessage('Contact number is required.')
    .matches(/^(\+?[0-9\s-]{7,15})$/).withMessage('Please provide a valid contact phone number (7-15 digits).'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('gender')
    .optional({ checkFalsy: true })
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Please select a valid gender option.'),

  body('address')
    .trim()
    .notEmpty().withMessage('City or residential address is required.')
    .isLength({ min: 3, max: 300 }).withMessage('Address must be between 3 and 300 characters.'),

  body('campId')
    .notEmpty().withMessage('Please select a medical camp.')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid medical camp selected.');
      }
      return true;
    }),

  body('reasonForParticipation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Reason for participation cannot exceed 500 characters.'),

  body('consent')
    .custom((value) => {
      if (value !== 'on' && value !== 'true' && value !== true) {
        throw new Error('You must accept the terms and provide consent to register.');
      }
      return true;
    })
];

module.exports = {
  registrationValidationRules
};
