const mongoose = require('mongoose');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

/**
 * Controller for Medical Camp Public Operations
 */
const campController = {
  /**
   * GET / - Homepage
   */
  async getHomePage(req, res, next) {
    try {
      // Get next 3 upcoming camps with open registration or upcoming status
      const upcomingCamps = await Camp.find({
        status: { $in: ['Upcoming', 'Ongoing'] },
        isArchived: false,
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
        .sort({ date: 1 })
        .limit(3);

      // Aggregated statistics for hero trust counters
      const totalCampsCount = await Camp.countDocuments({ isArchived: false });
      const totalRegistrationsCount = await Registration.countDocuments({ registrationStatus: 'Confirmed' });
      
      // Distinct specialties count
      const specialtiesList = await Camp.distinct('specialties', { isArchived: false });

      res.render('home', {
        pageTitle: 'Medical Camp Registration Portal - Free Healthcare Access',
        activeNav: 'home',
        upcomingCamps,
        stats: {
          totalCamps: totalCampsCount || 12,
          totalRegistrations: totalRegistrationsCount || 1500,
          specialtiesCount: specialtiesList.length || 15
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /about - About Us Page
   */
  getAboutPage(req, res) {
    res.render('about', {
      pageTitle: 'About Us - Medical Camp Registration Portal',
      activeNav: 'about'
    });
  },

  /**
   * GET /contact - Contact Us Page
   */
  getContactPage(req, res) {
    res.render('contact', {
      pageTitle: 'Contact Us - Medical Camp Registration Portal',
      activeNav: 'contact'
    });
  },

  /**
   * POST /contact - Process contact form submission
   */
  postContact(req, res) {
    const { name, email, subject, message } = req.body;
    // Demonstration feedback
    req.flash('success_msg', `Thank you, ${name || 'Friend'}! Your inquiry regarding "${subject || 'General Information'}" has been received. Our medical outreach team will contact you at ${email || 'your email'} shortly.`);
    res.redirect('/contact');
  },

  /**
   * GET /camps - Camp Listing with Search, Filter & Sort
   */
  async getAllCamps(req, res, next) {
    try {
      const { search, specialty, city, status, sortBy } = req.query;

      // Base query
      const query = { isArchived: false };

      // Search filter (name, description, venue, city)
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { 'location.venue': searchRegex },
          { 'location.city': searchRegex },
          { 'location.address': searchRegex },
          { 'organizer.name': searchRegex },
          { 'organizer.hospital': searchRegex }
        ];
      }

      // Specialty filter
      if (specialty && specialty.trim() !== 'all' && specialty.trim() !== '') {
        query.specialties = specialty.trim();
      }

      // City filter
      if (city && city.trim() !== 'all' && city.trim() !== '') {
        query['location.city'] = new RegExp(`^${city.trim()}$`, 'i');
      }

      // Status filter
      if (status && status.trim() !== 'all' && status.trim() !== '') {
        query.status = status.trim();
      }

      // Sorting
      let sortOption = { date: 1 }; // Default: earliest upcoming date first
      if (sortBy === 'date_desc') {
        sortOption = { date: -1 };
      } else if (sortBy === 'name_asc') {
        sortOption = { name: 1 };
      } else if (sortBy === 'capacity_desc') {
        sortOption = { capacity: -1 };
      }

      const camps = await Camp.find(query).sort(sortOption);

      // Collect distinct specialties and cities for filter dropdowns
      const [allSpecialties, allCities] = await Promise.all([
        Camp.distinct('specialties', { isArchived: false }),
        Camp.distinct('location.city', { isArchived: false })
      ]);

      res.render('camps/index', {
        pageTitle: 'Discover Medical Camps - Free Healthcare Clinics',
        activeNav: 'camps',
        camps,
        allSpecialties: allSpecialties.sort(),
        allCities: allCities.filter(Boolean).sort(),
        filters: {
          search: search || '',
          specialty: specialty || 'all',
          city: city || 'all',
          status: status || 'all',
          sortBy: sortBy || 'date_asc'
        },
        resultCount: camps.length
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /camps/:id - Camp Details Page
   */
  async getCampDetails(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error_msg', 'Invalid medical camp identifier.');
        return res.status(404).render('404', {
          pageTitle: 'Camp Not Found',
          path: req.originalUrl,
          message: 'The medical camp you requested does not exist.'
        });
      }

      const camp = await Camp.findOne({ _id: id, isArchived: false });
      if (!camp) {
        req.flash('error_msg', 'Medical camp not found.');
        return res.status(404).render('404', {
          pageTitle: 'Camp Not Found',
          path: req.originalUrl,
          message: 'The medical camp you requested could not be found or has been closed.'
        });
      }

      // Related / upcoming other camps
      const otherCamps = await Camp.find({
        _id: { $ne: camp._id },
        status: 'Upcoming',
        isArchived: false
      })
        .limit(3)
        .select('name date location specialties image capacity registrationCount status');

      res.render('camps/show', {
        pageTitle: `${camp.name} - Camp Details`,
        activeNav: 'camps',
        camp,
        otherCamps
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = campController;
