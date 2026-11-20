const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

/**
 * Controller for Administrative Operations
 */
const adminController = {
  /**
   * GET /admin/login - Admin Login Page
   */
  getLogin(req, res) {
    res.render('admin/login', {
      pageTitle: 'Administrator Login - Medical Camp Portal',
      layout: false, // Clean dedicated login layout
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg')
    });
  },

  /**
   * POST /admin/login - Authenticate Administrator
   */
  async postLogin(req, res, next) {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).render('admin/login', {
          pageTitle: 'Administrator Login - Medical Camp Portal',
          layout: false,
          error_msg: 'Please enter both your email/username and password.',
          success_msg: null
        });
      }

      const identifier = emailOrUsername.trim().toLowerCase();
      const admin = await Admin.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      });

      if (!admin) {
        return res.status(401).render('admin/login', {
          pageTitle: 'Administrator Login - Medical Camp Portal',
          layout: false,
          error_msg: 'Invalid administrative credentials provided.',
          success_msg: null
        });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).render('admin/login', {
          pageTitle: 'Administrator Login - Medical Camp Portal',
          layout: false,
          error_msg: 'Invalid administrative credentials provided.',
          success_msg: null
        });
      }

      // Update last login timestamp
      admin.lastLogin = new Date();
      await admin.save();

      // Establish session
      req.session.adminId = admin._id;
      req.session.adminName = admin.fullName;
      req.session.adminRole = admin.role;

      req.flash('success_msg', `Welcome back, ${admin.fullName}!`);
      const redirectUrl = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/logout - Destroy admin session
   */
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
      res.redirect('/admin/login');
    });
  },

  /**
   * GET /admin/dashboard - Overview statistics & metrics
   */
  async getDashboard(req, res, next) {
    try {
      const [
        totalCamps,
        upcomingCamps,
        totalRegistrations,
        confirmedRegistrations,
        cancelledRegistrations,
        recentRegistrations,
        allCamps
      ] = await Promise.all([
        Camp.countDocuments({ isArchived: false }),
        Camp.countDocuments({
          isArchived: false,
          status: { $in: ['Upcoming', 'Ongoing'] }
        }),
        Registration.countDocuments(),
        Registration.countDocuments({ registrationStatus: 'Confirmed' }),
        Registration.countDocuments({ registrationStatus: 'Cancelled' }),
        Registration.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate('campId', 'name date location'),
        Camp.find({ isArchived: false }).sort({ date: 1 }).limit(6)
      ]);

      // Calculate aggregate capacity utilization
      const capacityAgg = await Camp.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: null,
            totalCap: { $sum: '$capacity' },
            totalBooked: { $sum: '$registrationCount' }
          }
        }
      ]);

      const totalCap = capacityAgg.length > 0 ? capacityAgg[0].totalCap : 0;
      const totalBooked = capacityAgg.length > 0 ? capacityAgg[0].totalBooked : 0;
      const utilizationRate = totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0;

      res.render('admin/dashboard', {
        pageTitle: 'Admin Dashboard - Overview',
        activeNav: 'admin-dashboard',
        stats: {
          totalCamps,
          upcomingCamps,
          totalRegistrations,
          confirmedRegistrations,
          cancelledRegistrations,
          totalCapacity: totalCap,
          totalBooked,
          utilizationRate
        },
        recentRegistrations,
        upcomingCampsList: allCamps
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/camps - List all medical camps for management
   */
  async getCamps(req, res, next) {
    try {
      const { search, status } = req.query;
      const query = { isArchived: false };

      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { 'location.venue': regex },
          { 'location.city': regex },
          { 'organizer.hospital': regex }
        ];
      }

      if (status && status !== 'all') {
        query.status = status;
      }

      const camps = await Camp.find(query).sort({ date: -1 });

      res.render('admin/camps', {
        pageTitle: 'Manage Medical Camps',
        activeNav: 'admin-camps',
        camps,
        searchQuery: search || '',
        selectedStatus: status || 'all'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/camps/new - Render camp creation form
   */
  getNewCampForm(req, res) {
    res.render('admin/campForm', {
      pageTitle: 'Create New Medical Camp',
      activeNav: 'admin-camps',
      camp: null,
      isEdit: false,
      formData: {},
      formErrors: []
    });
  },

  /**
   * POST /admin/camps - Create a new medical camp
   */
  async postCreateCamp(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/campForm', {
        pageTitle: 'Create New Medical Camp - Errors',
        activeNav: 'admin-camps',
        camp: null,
        isEdit: false,
        formData: req.body,
        formErrors: errors.array()
      });
    }

    try {
      const {
        name,
        description,
        date,
        startTime,
        endTime,
        venue,
        address,
        city,
        state,
        pincode,
        specialties,
        services,
        organizerName,
        hospital,
        contactPerson,
        contactPhone,
        contactEmail,
        helpline,
        capacity,
        image,
        status
      } = req.body;

      // Parse specialties & services arrays
      const specialtiesArr = Array.isArray(specialties)
        ? specialties
        : (specialties || '').split(',').map((s) => s.trim()).filter(Boolean);

      const servicesArr = Array.isArray(services)
        ? services
        : (services || '').split(',').map((s) => s.trim()).filter(Boolean);

      const newCamp = new Camp({
        name: name.trim(),
        description: description.trim(),
        date: new Date(date),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: {
          venue: venue.trim(),
          address: address.trim(),
          city: city.trim(),
          state: (state || 'State').trim(),
          pincode: (pincode || '').trim()
        },
        specialties: specialtiesArr,
        services: servicesArr,
        organizer: {
          name: organizerName.trim(),
          hospital: (hospital || '').trim(),
          contactPerson: (contactPerson || '').trim()
        },
        contactInformation: {
          phone: contactPhone.trim(),
          email: contactEmail.trim().toLowerCase(),
          helpline: (helpline || '').trim()
        },
        capacity: parseInt(capacity, 10),
        registrationCount: 0,
        image: image && image.trim() !== '' ? image.trim() : '/images/camp-default.jpg',
        status: status || 'Upcoming'
      });

      await newCamp.save();
      req.flash('success_msg', `Medical camp "${newCamp.name}" successfully created!`);
      res.redirect('/admin/camps');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/camps/:id/edit - Render edit camp form
   */
  async getEditCampForm(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error_msg', 'Invalid camp ID.');
        return res.redirect('/admin/camps');
      }

      const camp = await Camp.findOne({ _id: id, isArchived: false });
      if (!camp) {
        req.flash('error_msg', 'Medical camp not found.');
        return res.redirect('/admin/camps');
      }

      res.render('admin/campForm', {
        pageTitle: `Edit Camp - ${camp.name}`,
        activeNav: 'admin-camps',
        camp,
        isEdit: true,
        formData: {},
        formErrors: []
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /admin/camps/:id - Update existing medical camp
   */
  async putUpdateCamp(req, res, next) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error_msg', 'Invalid camp ID.');
      return res.redirect('/admin/camps');
    }

    const camp = await Camp.findOne({ _id: id, isArchived: false });
    if (!camp) {
      req.flash('error_msg', 'Medical camp not found.');
      return res.redirect('/admin/camps');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/campForm', {
        pageTitle: `Edit Camp - ${camp.name}`,
        activeNav: 'admin-camps',
        camp,
        isEdit: true,
        formData: req.body,
        formErrors: errors.array()
      });
    }

    try {
      const {
        name,
        description,
        date,
        startTime,
        endTime,
        venue,
        address,
        city,
        state,
        pincode,
        specialties,
        services,
        organizerName,
        hospital,
        contactPerson,
        contactPhone,
        contactEmail,
        helpline,
        capacity,
        image,
        status
      } = req.body;

      const newCapacity = parseInt(capacity, 10);
      if (newCapacity < camp.registrationCount) {
        req.flash(
          'error_msg',
          `Cannot reduce capacity to ${newCapacity} because ${camp.registrationCount} participants are already registered.`
        );
        return res.status(400).render('admin/campForm', {
          pageTitle: `Edit Camp - ${camp.name}`,
          activeNav: 'admin-camps',
          camp,
          isEdit: true,
          formData: req.body,
          formErrors: [
            {
              msg: `Capacity cannot be lower than existing confirmed registrations (${camp.registrationCount}).`
            }
          ]
        });
      }

      const specialtiesArr = Array.isArray(specialties)
        ? specialties
        : (specialties || '').split(',').map((s) => s.trim()).filter(Boolean);

      const servicesArr = Array.isArray(services)
        ? services
        : (services || '').split(',').map((s) => s.trim()).filter(Boolean);

      camp.name = name.trim();
      camp.description = description.trim();
      camp.date = new Date(date);
      camp.startTime = startTime.trim();
      camp.endTime = endTime.trim();
      camp.location = {
        venue: venue.trim(),
        address: address.trim(),
        city: city.trim(),
        state: (state || 'State').trim(),
        pincode: (pincode || '').trim()
      };
      camp.specialties = specialtiesArr;
      camp.services = servicesArr;
      camp.organizer = {
        name: organizerName.trim(),
        hospital: (hospital || '').trim(),
        contactPerson: (contactPerson || '').trim()
      };
      camp.contactInformation = {
        phone: contactPhone.trim(),
        email: contactEmail.trim().toLowerCase(),
        helpline: (helpline || '').trim()
      };
      camp.capacity = newCapacity;
      if (image && image.trim() !== '') camp.image = image.trim();
      camp.status = status;

      await camp.save();
      req.flash('success_msg', `Medical camp "${camp.name}" updated successfully!`);
      res.redirect('/admin/camps');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /admin/camps/:id - Safe deletion or archiving of camp
   */
  async deleteCamp(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error_msg', 'Invalid camp ID.');
        return res.redirect('/admin/camps');
      }

      const camp = await Camp.findById(id);
      if (!camp) {
        req.flash('error_msg', 'Camp not found.');
        return res.redirect('/admin/camps');
      }

      // Check if camp has confirmed registrations
      const activeRegistrations = await Registration.countDocuments({
        campId: camp._id,
        registrationStatus: 'Confirmed'
      });

      if (activeRegistrations > 0) {
        // Soft delete / archive to preserve patient registration history
        camp.isArchived = true;
        camp.status = 'Cancelled';
        await camp.save();
        req.flash(
          'warning_msg',
          `Camp "${camp.name}" has ${activeRegistrations} active participant registrations. It has been archived and cancelled to preserve records.`
        );
      } else {
        await Camp.findByIdAndDelete(camp._id);
        req.flash('success_msg', `Camp "${camp.name}" successfully deleted.`);
      }

      res.redirect('/admin/camps');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /admin/registrations - Participant Registration Monitoring
   */
  async getRegistrations(req, res, next) {
    try {
      const { search, campId, status, page = 1 } = req.query;
      const limit = 15;
      const currentPage = Math.max(1, parseInt(page, 10));

      const query = {};

      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { fullName: regex },
          { email: regex },
          { contactNumber: regex },
          { registrationReference: regex.source.toUpperCase() }
        ];
      }

      if (campId && mongoose.Types.ObjectId.isValid(campId)) {
        query.campId = campId;
      }

      if (status && status !== 'all') {
        query.registrationStatus = status;
      }

      const [registrations, totalCount, allCamps] = await Promise.all([
        Registration.find(query)
          .sort({ createdAt: -1 })
          .skip((currentPage - 1) * limit)
          .limit(limit)
          .populate('campId', 'name date location status'),
        Registration.countDocuments(query),
        Camp.find({ isArchived: false }).select('name').sort({ name: 1 })
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      res.render('admin/registrations', {
        pageTitle: 'Participant Registrations Management',
        activeNav: 'admin-registrations',
        registrations,
        allCamps,
        selectedCampId: campId || 'all',
        selectedStatus: status || 'all',
        searchQuery: search || '',
        pagination: {
          currentPage,
          totalPages,
          totalCount,
          limit
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /admin/registrations/:id/status - Update registration status (Confirmed/Attended)
   */
  async updateRegistrationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Confirmed', 'Attended'].includes(status)) {
        req.flash('error_msg', 'Invalid status update requested.');
        return res.redirect('/admin/registrations');
      }

      const registration = await Registration.findById(id);
      if (!registration) {
        req.flash('error_msg', 'Registration not found.');
        return res.redirect('/admin/registrations');
      }

      registration.registrationStatus = status;
      await registration.save();

      req.flash('success_msg', `Status for reference ${registration.registrationReference} updated to ${status}.`);
      res.redirect(req.get('Referrer') || '/admin/registrations');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /admin/registrations/:id/cancel - Cancel registration and release capacity
   */
  async cancelRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const registration = await Registration.findById(id);
      if (!registration) {
        req.flash('error_msg', 'Registration not found.');
        return res.redirect('/admin/registrations');
      }

      if (registration.registrationStatus === 'Cancelled') {
        req.flash('error_msg', 'This registration is already cancelled.');
        return res.redirect('/admin/registrations');
      }

      // If it was confirmed, release capacity back to camp safely
      if (registration.registrationStatus === 'Confirmed') {
        await Camp.findByIdAndUpdate(registration.campId, {
          $inc: { registrationCount: -1 }
        });
      }

      registration.registrationStatus = 'Cancelled';
      registration.cancellationReason = (reason || 'Administrative cancellation').trim();
      registration.cancelledAt = new Date();
      await registration.save();

      req.flash(
        'success_msg',
        `Registration ${registration.registrationReference} cancelled and 1 capacity seat released back to the camp.`
      );
      res.redirect(req.get('Referrer') || '/admin/registrations');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = adminController;
