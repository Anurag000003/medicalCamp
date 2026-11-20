const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Camp = require('../models/Camp');

describe('Medical Camp Public Routes & Functionality', () => {
  let sampleCampId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Ensure at least one test camp exists
    let camp = await Camp.findOne({ isArchived: false });
    if (!camp) {
      camp = new Camp({
        name: 'Unit Test General Health Screening Camp',
        description: 'Comprehensive health screening clinic for automated integration tests.',
        date: new Date(Date.now() + 86400000 * 5),
        startTime: '09:00 AM',
        endTime: '02:00 PM',
        location: {
          venue: 'Test Community Center',
          address: '101 Test Road',
          city: 'Springfield',
          state: 'Illinois',
          pincode: '62701'
        },
        specialties: ['General Medicine', 'Cardiology'],
        services: ['Blood Pressure Check', 'Blood Glucose Check'],
        organizer: {
          name: 'Test Healthcare Foundation',
          hospital: 'Springfield General'
        },
        contactInformation: {
          phone: '+1 555-000-1111',
          email: 'test@campfoundation.org'
        },
        capacity: 50,
        registrationCount: 0,
        status: 'Upcoming'
      });
      await camp.save();
    }
    sampleCampId = camp._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. GET / - Homepage loads successfully with HTTP 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Medical Camp');
    expect(res.text).toContain('Free Community');
  });

  test('2. GET /about - About Us loads successfully with HTTP 200', async () => {
    const res = await request(app).get('/about');
    expect(res.status).toBe(200);
    expect(res.text).toContain('About Our Mission');
  });

  test('3. GET /contact - Contact Us loads with HTTP 200', async () => {
    const res = await request(app).get('/contact');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Contact Medical Outreach Support');
  });

  test('4. GET /camps - Camp listings display database records', async () => {
    const res = await request(app).get('/camps');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Discover Available Medical Camps');
    expect(res.text).toContain('View Details');
  });

  test('5. GET /camps?search=Springfield - Search and filter works correctly', async () => {
    const res = await request(app).get('/camps?search=Springfield');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Springfield');
  });

  test('6. GET /camps/:id - Valid camp ID returns details page', async () => {
    const res = await request(app).get(`/camps/${sampleCampId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('About This Medical Camp');
    expect(res.text).toContain('Registration Status');
  });

  test('7. GET /camps/:invalidId - Invalid ID format returns HTTP 404', async () => {
    const res = await request(app).get('/camps/not-a-valid-object-id');
    expect(res.status).toBe(404);
    expect(res.text).toContain('Medical Resource Not Found');
  });

  test('8. GET /non-existent-page - Missing page returns 404', async () => {
    const res = await request(app).get('/some-random-missing-page');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404');
  });
});
