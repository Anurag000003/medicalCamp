const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Admin = require('../models/Admin');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

describe('Admin Authentication, Authorization & CRUD Management Tests', () => {
  let adminUser;
  let testCamp;
  let testReg;
  let adminSessionCookie;

  const testEmail = 'testadmin@medicalcamp.org';
  const testPassword = 'SecureAdminPassword!123';

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Create or reset test admin
    await Admin.deleteMany({ email: testEmail });
    adminUser = new Admin({
      username: 'testadmin',
      email: testEmail,
      password: testPassword,
      fullName: 'Dr. Test Administrator',
      role: 'superadmin'
    });
    await adminUser.save();

    // Create a camp and registration to test status & capacity release
    testCamp = new Camp({
      name: 'Admin Suite Test Camp',
      description: 'Camp for admin management verification.',
      date: new Date(Date.now() + 86400000 * 8),
      startTime: '09:00 AM',
      endTime: '03:00 PM',
      location: {
        venue: 'Administrative Pavilion',
        address: '500 Executive Drive',
        city: 'Peoria',
        state: 'Illinois',
        pincode: '61602'
      },
      specialties: ['General Medicine'],
      services: ['Blood Pressure Consultation'],
      organizer: {
        name: 'Illinois Health Outreach'
      },
      contactInformation: {
        phone: '+1 555-444-3333',
        email: 'admin@il-outreach.org'
      },
      capacity: 25,
      registrationCount: 1,
      status: 'Upcoming'
    });
    await testCamp.save();

    testReg = new Registration({
      registrationReference: Registration.generateReference(),
      fullName: 'Cancellation Test Patient',
      age: 40,
      contactNumber: '+1 555-222-1111',
      email: 'cancel.patient@example.com',
      address: '77 Admin Row, Peoria, IL',
      campId: testCamp._id,
      consent: true,
      registrationStatus: 'Confirmed'
    });
    await testReg.save();
  });

  afterAll(async () => {
    if (adminUser) await Admin.deleteMany({ email: testEmail });
    if (testCamp) await Camp.findByIdAndDelete(testCamp._id);
    if (testReg) await Registration.findByIdAndDelete(testReg._id);
    await mongoose.connection.close();
  });

  test('1. Unauthorized users are blocked from /admin/dashboard and redirected to login', async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/login');
  });

  test('2. Unauthorized users are blocked from /admin/camps', async () => {
    const res = await request(app).get('/admin/camps');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/login');
  });

  test('3. POST /admin/login - Invalid password rejects login with HTTP 401', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({
        emailOrUsername: testEmail,
        password: 'WrongPassword123'
      });

    expect(res.status).toBe(401);
  });

  test('4. POST /admin/login - Valid credentials authenticates admin and issues session', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({
        emailOrUsername: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/dashboard');

    // Save session cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    adminSessionCookie = cookies;
  });

  test('5. Authenticated admin can access /admin/dashboard with HTTP 200', async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('Cookie', adminSessionCookie);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Medical Camp Operational Dashboard');
    expect(res.text).toContain('Dr. Test Administrator');
  });

  test('6. Authenticated admin can create a new medical camp (CRUD - Create)', async () => {
    const res = await request(app)
      .post('/admin/camps')
      .set('Cookie', adminSessionCookie)
      .send({
        name: 'Brand New Automated Camp',
        description: 'New clinic created via automated administrator test suite.',
        date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
        startTime: '08:30 AM',
        endTime: '01:30 PM',
        venue: 'Community Plaza East',
        address: '123 New Road',
        city: 'Rockford',
        state: 'Illinois',
        pincode: '61101',
        specialties: 'Endocrinology, General Medicine',
        services: 'Free Blood Sugar Test, Doctor Consult',
        organizerName: 'Automated Health Trust',
        contactPhone: '+1 555-888-7777',
        contactEmail: 'contact@autotrust.org',
        capacity: 75,
        status: 'Upcoming'
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/camps');

    const created = await Camp.findOne({ name: 'Brand New Automated Camp' });
    expect(created).not.toBeNull();
    expect(created.capacity).toBe(75);

    // Clean up
    await Camp.findByIdAndDelete(created._id);
  });

  test('7. Authenticated admin can update camp details (CRUD - Update)', async () => {
    const res = await request(app)
      .put(`/admin/camps/${testCamp._id}`)
      .set('Cookie', adminSessionCookie)
      .send({
        name: 'Admin Suite Test Camp - UPDATED',
        description: 'Updated camp description for test.',
        date: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '04:00 PM',
        venue: 'Administrative Pavilion Main Hall',
        address: '500 Executive Drive',
        city: 'Peoria',
        state: 'Illinois',
        pincode: '61602',
        specialties: 'General Medicine, Cardiology',
        services: 'Blood Pressure Consultation, ECG',
        organizerName: 'Illinois Health Outreach',
        contactPhone: '+1 555-444-3333',
        contactEmail: 'admin@il-outreach.org',
        capacity: 30, // Updated capacity
        status: 'Upcoming'
      });

    expect(res.status).toBe(302);
    const updated = await Camp.findById(testCamp._id);
    expect(updated.name).toBe('Admin Suite Test Camp - UPDATED');
    expect(updated.capacity).toBe(30);
  });

  test('8. Cancelling a confirmed registration releases capacity seat back to camp', async () => {
    // Before cancellation, count is 1
    const beforeCamp = await Camp.findById(testCamp._id);
    expect(beforeCamp.registrationCount).toBe(1);

    const res = await request(app)
      .post(`/admin/registrations/${testReg._id}/cancel`)
      .set('Cookie', adminSessionCookie)
      .send({ reason: 'Participant unable to attend' });

    expect(res.status).toBe(302);

    // Verify registration status is now Cancelled
    const updatedReg = await Registration.findById(testReg._id);
    expect(updatedReg.registrationStatus).toBe('Cancelled');
    expect(updatedReg.cancellationReason).toBe('Participant unable to attend');

    // Verify camp capacity was atomically released (-1)
    const afterCamp = await Camp.findById(testCamp._id);
    expect(afterCamp.registrationCount).toBe(0);
  });
});
