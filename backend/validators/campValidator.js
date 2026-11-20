const { body } = require('express-validator');

const campValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Camp name is required.')
    .isLength({ min: 3, max: 150 }).withMessage('Camp name must be between 3 and 150 characters.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Camp description is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters.'),

  body('date')
    .notEmpty().withMessage('Camp date is required.')
    .isISO8601().withMessage('Please provide a valid date format (YYYY-MM-DD).'),

  body('startTime')
    .trim()
    .notEmpty().withMessage('Start time is required.'),

  body('endTime')
    .trim()
    .notEmpty().withMessage('End time is required.'),

  body('venue')
    .trim()
    .notEmpty().withMessage('Venue name is required.'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required.'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required.'),

  body('specialties')
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === 'string' && value.trim().length > 0) return true;
      throw new Error('At least one medical specialty is required.');
    }),

  body('services')
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === 'string' && value.trim().length > 0) return true;
      throw new Error('At least one medical service is required.');
    }),

  body('organizerName')
    .trim()
    .notEmpty().withMessage('Organizer name is required.'),

  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone number is required.'),

  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required.')
    .isEmail().withMessage('Please enter a valid organizer contact email.')
    .normalizeEmail(),

  body('capacity')
    .notEmpty().withMessage('Registration capacity is required.')
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer of at least 1.')
];

module.exports = {
  campValidationRules
};
