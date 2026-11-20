const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

describe('Registration Functionality & Capacity Management Tests', () => {
  let testCamp;
  let fullCamp;
  let createdRegistrationRef;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Create an open test camp
    testCamp = new Camp({
      name: 'Registration Workflow Test Camp',
      description: 'Medical camp created exclusively for registration validation tests.',
      date: new Date(Date.now() + 86400000 * 10),
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      location: {
        venue: 'Testing Hall',
        address: '404 Automated Lane',
        city: 'Naperville',
        state: 'Illinois',
        pincode: '60540'
      },
      specialties: ['General Medicine'],
      services: ['Blood Pressure Check'],
      organizer: {
        name: 'Test Healthcare League'
      },
      contactInformation: {
        phone: '+1 555-999-8888',
        email: 'test@registrationleague.org'
      },
      capacity: 10,
      registrationCount: 0,
      status: 'Upcoming'
    });
    await testCamp.save();

    // Create a camp that is completely full
    fullCamp = new Camp({
      name: 'Fully Booked Demonstration Camp',
      description: 'Camp at maximum capacity to test overbooking rejection.',
      date: new Date(Date.now() + 86400000 * 12),
      startTime: '08:00 AM',
      endTime: '02:00 PM',
      location: {
        venue: 'Max Capacity Pavilion',
        address: '100 Full Street',
        city: 'Aurora',
        state: 'Illinois',
        pincode: '60505'
      },
      specialties: ['Cardiology'],
      services: ['ECG'],
      organizer: {
        name: 'Full Camp Organizer'
      },
      contactInformation: {
        phone: '+1 555-777-6666',
        email: 'full@camp.org'
      },
      capacity: 1,
      registrationCount: 1, // Full!
      status: 'Upcoming'
    });
    await fullCamp.save();
  });

  afterAll(async () => {
    // Cleanup created test camps and registrations
    if (testCamp) {
      await Registration.deleteMany({ campId: testCamp._id });
      await Camp.findByIdAndDelete(testCamp._id);
    }
    if (fullCamp) {
      await Registration.deleteMany({ campId: fullCamp._id });
      await Camp.findByIdAndDelete(fullCamp._id);
    }
    await mongoose.connection.close();
  });

  test('1. GET /register - Displays registration form with HTTP 200', async () => {
    const res = await request(app).get('/register');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Free Medical Camp Registration');
    expect(res.text).toContain('campSelect');
  });

  test('2. POST /register - Invalid submission (missing name, invalid age) returns HTTP 400', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        fullName: '',
        age: '250', // Invalid age > 120
        contactNumber: '123', // Invalid phone
        email: 'not-an-email',
        address: '',
        campId: testCamp._id.toString(),
        consent: '' // Missing consent
      });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Please resolve the following before submitting');
    expect(res.text).toContain('Full name is required');
    expect(res.text).toContain('Age must be a valid number between 1 and 120');
  });

  test('3. POST /register - Valid registration successfully saves and increments capacity safely', async () => {
    const initialCamp = await Camp.findById(testCamp._id);
    const initialCount = initialCamp.registrationCount;

    const res = await request(app)
      .post('/register')
      .send({
        fullName: 'Marcus Aurelius Test',
        age: 38,
        contactNumber: '+1 555-888-9999',
        email: 'marcus.test@example.com',
        gender: 'Male',
        address: '12 Caesar Way, Naperville, IL',
        campId: testCamp._id.toString(),
        reasonForParticipation: 'Routine checkup for testing',
        consent: 'on'
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/registrations/confirmation/MCR-');

    // Extract reference code from redirect URL
    const parts = res.headers.location.split('/');
    createdRegistrationRef = parts[parts.length - 1];
    expect(createdRegistrationRef).toMatch(/^MCR-\d{4}-[A-Z0-9]+$/);

    // Verify registration saved in database
    const savedReg = await Registration.findOne({ registrationReference: createdRegistrationRef });
    expect(savedReg).not.toBeNull();
    expect(savedReg.fullName).toBe('Marcus Aurelius Test');
    expect(savedReg.registrationStatus).toBe('Confirmed');

    // Verify camp capacity incremented atomically
    const updatedCamp = await Camp.findById(testCamp._id);
    expect(updatedCamp.registrationCount).toBe(initialCount + 1);
  });

  test('4. GET /registrations/confirmation/:reference - Displays print pass with HTTP 200', async () => {
    const res = await request(app).get(`/registrations/confirmation/${createdRegistrationRef}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(createdRegistrationRef);
    expect(res.text).toContain('Marcus Aurelius Test');
    expect(res.text).toContain('Print / Save Pass');
  });

  test('5. POST /register - Duplicate registration prevention returns HTTP 409', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        fullName: 'Marcus Aurelius Test',
        age: 38,
        contactNumber: '+1 555-888-9999',
        email: 'marcus.test@example.com', // Same email and camp!
        gender: 'Male',
        address: '12 Caesar Way, Naperville, IL',
        campId: testCamp._id.toString(),
        consent: 'on'
      });

    expect(res.status).toBe(409);
    expect(res.text).toContain('Duplicate Registration');
    expect(res.text).toContain('A confirmed registration already exists');
  });

  test('6. POST /register - Rejects registration when camp is full', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        fullName: 'Late Patient',
        age: 30,
        contactNumber: '+1 555-000-2222',
        email: 'late.patient@example.com',
        address: '99 Full Blvd, Aurora, IL',
        campId: fullCamp._id.toString(),
        consent: 'on'
      });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Camp Full');
    expect(res.text).toContain('maximum registration capacity');
  });

  test('7. POST /registrations/lookup - Successfully searches registration by phone or email', async () => {
    const res = await request(app)
      .post('/registrations/lookup')
      .send({ query: 'marcus.test@example.com' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Matching Registrations');
    expect(res.text).toContain(createdRegistrationRef);
  });
});
