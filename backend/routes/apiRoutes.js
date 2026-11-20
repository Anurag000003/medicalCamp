const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');
const { registrationValidationRules } = require('../validators/registrationValidator');
const { validationResult } = require('express-validator');

// GET /api/camps - Get all upcoming/open camps
router.get('/camps', async (req, res) => {
  try {
    const { specialty, city, search } = req.query;
    let query = { isArchived: false, status: { $in: ['Upcoming', 'Ongoing'] } };

    if (specialty && specialty !== 'all') {
      query.specialties = specialty;
    }
    if (city && city !== 'all') {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.venue': new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') },
        { 'organizer.hospital': new RegExp(search, 'i') }
      ];
    }

    const camps = await Camp.find(query).sort({ date: 1 });
    res.json({ success: true, count: camps.length, data: camps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/camps/:id - Get camp details
router.get('/camps/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Camp ID' });
    }
    const camp = await Camp.findOne({ _id: req.params.id, isArchived: false });
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }
    res.json({ success: true, data: camp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/register - Register participant
router.post('/register', registrationValidationRules, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      campId,
      fullName,
      age,
      gender,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactPhone,
      symptoms,
      consentAgreed
    } = req.body;

    // Check if camp exists and has capacity
    const camp = await Camp.findOne({ _id: campId, isArchived: false });
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Medical camp not found' });
    }

    // Atomic increment
    const updatedCamp = await Camp.findOneAndUpdate(
      {
        _id: campId,
        status: { $in: ['Upcoming', 'Ongoing'] },
        isArchived: false,
        $expr: { $lt: ['$registrationCount', '$capacity'] }
      },
      { $inc: { registrationCount: 1 } },
      { new: true }
    );

    if (!updatedCamp) {
      return res.status(400).json({ success: false, message: 'Camp is full or closed for registrations.' });
    }

    // Create registration
    try {
      const registration = new Registration({
        campId,
        fullName: fullName.trim(),
        age: parseInt(age, 10),
        gender,
        contactNumber: contactNumber.trim(),
        email: email ? email.trim().toLowerCase() : undefined,
        address: address ? address.trim() : '',
        emergencyContact: {
          name: emergencyContactName ? emergencyContactName.trim() : '',
          phone: emergencyContactPhone ? emergencyContactPhone.trim() : ''
        },
        symptoms: symptoms ? symptoms.trim() : '',
        consentAgreed: consentAgreed === true || consentAgreed === 'true' || consentAgreed === 'on',
        registrationStatus: 'Confirmed'
      });

      await registration.save();

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          referenceNumber: registration.referenceNumber,
          fullName: registration.fullName,
          campName: updatedCamp.name,
          date: updatedCamp.date,
          venue: `${updatedCamp.location.venue}, ${updatedCamp.location.city}`,
          time: `${updatedCamp.startTime} - ${updatedCamp.endTime}`
        }
      });
    } catch (saveErr) {
      // Rollback count if registration document creation failed
      await Camp.findByIdAndUpdate(campId, { $inc: { registrationCount: -1 } });
      throw saveErr;
    }
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already registered for this camp with this phone/email.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
