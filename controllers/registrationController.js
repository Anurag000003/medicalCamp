const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

/**
 * Controller for Patient / Participant Registration Operations
 */
const registrationController = {
  /**
   * GET /register - Display registration form
   */
  async getRegistrationForm(req, res, next) {
    try {
      const selectedCampId = req.query.campId || '';

      // Get all active, open camps
      const availableCamps = await Camp.find({
        status: { $in: ['Upcoming', 'Ongoing'] },
        isArchived: false,
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }).sort({ date: 1 });

      let selectedCamp = null;
      if (selectedCampId && mongoose.Types.ObjectId.isValid(selectedCampId)) {
        selectedCamp = await Camp.findOne({ _id: selectedCampId, isArchived: false });
        if (selectedCamp && (selectedCamp.registrationCount >= selectedCamp.capacity || selectedCamp.status === 'Completed' || selectedCamp.status === 'Cancelled')) {
          req.flash('error_msg', `Notice: "${selectedCamp.name}" is currently full or closed for registrations. Please select another available camp.`);
        }
      }

      res.render('registrations/new', {
        pageTitle: 'Register for Medical Camp - Free Patient Registration',
        activeNav: 'register',
        availableCamps,
        selectedCampId,
        selectedCamp,
        formData: {},
        formErrors: []
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /register - Process and validate registration submission
   */
  async postRegistration(req, res, next) {
    const errors = validationResult(req);
    const {
      fullName,
      age,
      contactNumber,
      email,
      gender,
      address,
      campId,
      reasonForParticipation,
      consent
    } = req.body;

    const availableCamps = await Camp.find({
      status: { $in: ['Upcoming', 'Ongoing'] },
      isArchived: false,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).sort({ date: 1 });

    if (!errors.isEmpty()) {
      return res.status(400).render('registrations/new', {
        pageTitle: 'Register for Medical Camp - Errors Encountered',
        activeNav: 'register',
        availableCamps,
        selectedCampId: campId,
        selectedCamp: null,
        formData: req.body,
        formErrors: errors.array()
      });
    }

    try {
      // 1. Verify that the selected camp exists and is active
      const camp = await Camp.findOne({ _id: campId, isArchived: false });
      if (!camp) {
        return res.status(404).render('registrations/new', {
          pageTitle: 'Register for Medical Camp',
          activeNav: 'register',
          availableCamps,
          selectedCampId: '',
          selectedCamp: null,
          formData: req.body,
          formErrors: [{ msg: 'The selected medical camp does not exist or has been removed.' }]
        });
      }

      if (camp.status === 'Completed' || camp.status === 'Cancelled') {
        return res.status(400).render('registrations/new', {
          pageTitle: 'Register for Medical Camp',
          activeNav: 'register',
          availableCamps,
          selectedCampId: campId,
          selectedCamp: camp,
          formData: req.body,
          formErrors: [{ msg: `Registration is closed for "${camp.name}" because the camp is marked as ${camp.status.toLowerCase()}.` }]
        });
      }

      // 2. Prevent duplicate active registrations for the same person at the same camp
      const normalizedEmail = (email || '').toLowerCase().trim();
      const normalizedPhone = (contactNumber || '').replace(/\D/g, '');

      const existingRegistration = await Registration.findOne({
        campId: camp._id,
        registrationStatus: 'Confirmed',
        $or: [
          { email: normalizedEmail },
          { contactNumber: contactNumber.trim() }
        ]
      });

      if (existingRegistration) {
        return res.status(409).render('registrations/new', {
          pageTitle: 'Register for Medical Camp - Duplicate Registration',
          activeNav: 'register',
          availableCamps,
          selectedCampId: campId,
          selectedCamp: camp,
          formData: req.body,
          formErrors: [{
            msg: `A confirmed registration already exists for ${existingRegistration.fullName} with reference "${existingRegistration.registrationReference}". Duplicate registrations for the same camp are not permitted.`
          }]
        });
      }

      // 3. Atomically check capacity and increment registrationCount to avoid race conditions
      const updatedCamp = await Camp.findOneAndUpdate(
        {
          _id: camp._id,
          status: { $in: ['Upcoming', 'Ongoing'] },
          isArchived: false,
          $expr: { $lt: ['$registrationCount', '$capacity'] }
        },
        { $inc: { registrationCount: 1 } },
        { new: true }
      );

      if (!updatedCamp) {
        return res.status(400).render('registrations/new', {
          pageTitle: 'Register for Medical Camp - Camp Full',
          activeNav: 'register',
          availableCamps,
          selectedCampId: campId,
          selectedCamp: camp,
          formData: req.body,
          formErrors: [{ msg: `We are sorry! "${camp.name}" has just reached its maximum registration capacity (${camp.capacity} participants). Please select another camp.` }]
        });
      }

      // 4. Generate unique registration reference
      let uniqueRef = Registration.generateReference();
      // Ensure reference uniqueness
      let refExists = await Registration.exists({ registrationReference: uniqueRef });
      while (refExists) {
        uniqueRef = Registration.generateReference();
        refExists = await Registration.exists({ registrationReference: uniqueRef });
      }

      // 5. Create and persist registration record
      const registration = new Registration({
        registrationReference: uniqueRef,
        fullName: fullName.trim(),
        age: parseInt(age, 10),
        contactNumber: contactNumber.trim(),
        email: normalizedEmail,
        gender: gender || 'Prefer not to say',
        address: address.trim(),
        campId: camp._id,
        reasonForParticipation: (reasonForParticipation || '').trim(),
        consent: consent === 'on' || consent === true || consent === 'true',
        registrationStatus: 'Confirmed'
      });

      try {
        await registration.save();
      } catch (saveError) {
        // Rollback atomic counter increment if saving the registration fails
        await Camp.findByIdAndUpdate(camp._id, { $inc: { registrationCount: -1 } });
        throw saveError;
      }

      req.flash('success_msg', 'Your registration has been successfully confirmed!');
      res.redirect(`/registrations/confirmation/${registration.registrationReference}`);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /registrations/confirmation/:reference - Print-friendly registration pass
   */
  async getConfirmationPage(req, res, next) {
    try {
      const { reference } = req.params;

      const registration = await Registration.findOne({
        registrationReference: reference.toUpperCase()
      }).populate('campId');

      if (!registration) {
        req.flash('error_msg', 'Registration reference not found.');
        return res.status(404).render('404', {
          pageTitle: 'Registration Pass Not Found',
          path: req.originalUrl,
          message: `No registration found matching reference "${reference}". Please verify the reference number or contact support.`
        });
      }

      res.render('registrations/success', {
        pageTitle: `Registration Pass - ${registration.registrationReference}`,
        activeNav: 'register',
        registration,
        camp: registration.campId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /registrations/lookup - Search existing registration by reference or contact
   */
  getLookupPage(req, res) {
    res.render('registrations/lookup', {
      pageTitle: 'Lookup Registration Pass - Medical Camp Portal',
      activeNav: 'lookup',
      result: null,
      searched: false
    });
  },

  /**
   * POST /registrations/lookup - Execute search for existing registration
   */
  async postLookup(req, res, next) {
    try {
      const { query } = req.body;
      if (!query || query.trim() === '') {
        req.flash('error_msg', 'Please provide a registration reference, email address, or contact number.');
        return res.redirect('/registrations/lookup');
      }

      const searchTerm = query.trim();
      const results = await Registration.find({
        $or: [
          { registrationReference: searchTerm.toUpperCase() },
          { email: searchTerm.toLowerCase() },
          { contactNumber: searchTerm }
        ]
      })
        .populate('campId')
        .sort({ createdAt: -1 });

      res.render('registrations/lookup', {
        pageTitle: 'Registration Search Results',
        activeNav: 'lookup',
        searchTerm,
        results,
        searched: true
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = registrationController;
