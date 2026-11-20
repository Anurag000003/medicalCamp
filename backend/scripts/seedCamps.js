require('dotenv').config();
const mongoose = require('mongoose');
const Camp = require('../models/Camp');
const Registration = require('../models/Registration');

const seedCamps = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for camp data seeding...');

    // Clear existing demonstration data
    await Camp.deleteMany({});
    await Registration.deleteMany({});
    console.log('[Seed] Cleared existing camps and registration records.');

    const now = new Date();
    const addDays = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };

    const demonstrationCamps = [
      {
        name: 'Community Comprehensive Cardiology & Heart Health Camp',
        description: 'A free community cardiac screening clinic focused on early detection of hypertension, arrhythmias, coronary artery health, and cardiovascular risk factors. Free ECG, lipid profile consultation, and cardiologist advisory sessions provided.',
        date: addDays(4),
        startTime: '08:30 AM',
        endTime: '03:30 PM',
        location: {
          venue: 'Metro Civic Community Center, Hall A',
          address: '450 Health Avenue, Civic District',
          city: 'Springfield',
          state: 'Illinois',
          pincode: '62701'
        },
        specialties: ['Cardiology', 'General Medicine', 'Endocrinology'],
        services: [
          'Free 12-Lead Electrocardiogram (ECG)',
          'Blood Pressure & Vitals Assessment',
          'Blood Glucose & Cholesterol Rapid Test',
          'One-on-One Cardiologist Consultation',
          'Free Essential Cardiac Care Medication Starter Kit'
        ],
        organizer: {
          name: 'HeartGuard Outreach Foundation',
          hospital: 'St. Jude Memorial Cardiac Institute',
          contactPerson: 'Dr. Evelyn Reed, MD (Outreach Director)'
        },
        contactInformation: {
          phone: '+1 (555) 234-5678',
          email: 'outreach@heartguard-foundation.org',
          helpline: '1-800-HEART-HELP'
        },
        capacity: 150,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      },
      {
        name: 'Pediatric Wellness & Child Development Clinic',
        description: 'Dedicated child healthcare camp featuring pediatric physicals, developmental milestone assessments, vision & hearing screenings, dental hygiene checks, and nutritional counseling for infants, children, and adolescents.',
        date: addDays(7),
        startTime: '09:00 AM',
        endTime: '02:00 PM',
        location: {
          venue: 'Oakwood Public School Auditorium',
          address: '128 Schoolhouse Lane',
          city: 'Naperville',
          state: 'Illinois',
          pincode: '60540'
        },
        specialties: ['Pediatrics', 'Ophthalmology', 'Dental', 'Nutrition'],
        services: [
          'Full Pediatric Physical Examination',
          'Growth & Milestone Developmental Screening',
          'Pediatric Eye & Vision Screening',
          'Dental Cavity & Fluoride Varnish Application',
          'Nutritional & Healthy Habits Guidance for Parents'
        ],
        organizer: {
          name: 'Illinois Child Health Alliance',
          hospital: 'Children First Regional Hospital',
          contactPerson: 'Dr. Marcus Vance, FAAP'
        },
        contactInformation: {
          phone: '+1 (555) 345-6789',
          email: 'pediatrics@childhealth-alliance.org',
          helpline: '1-888-KID-CARE'
        },
        capacity: 120,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      },
      {
        name: 'Geriatric Bone, Joint & Orthopedic Mobility Camp',
        description: 'Comprehensive musculoskeletal health screening for seniors and adults suffering from joint pain, arthritis, back conditions, and mobility limitations. Includes bone mineral density scans and physiotherapy consultations.',
        date: addDays(11),
        startTime: '09:30 AM',
        endTime: '04:00 PM',
        location: {
          venue: 'Silver Pines Senior Activity Pavilion',
          address: '89 Elderwood Parkway',
          city: 'Aurora',
          state: 'Illinois',
          pincode: '60505'
        },
        specialties: ['Orthopedics', 'Rheumatology', 'Physiotherapy', 'Geriatrics'],
        services: [
          'Bone Mineral Density (DEXA) Screening',
          'Arthritis & Joint Mobility Evaluation',
          'Ergonomic & Fall Prevention Counseling',
          'Individual Physiotherapy Exercise Guidance',
          'Free Joint Support Brace Distribution (for eligible seniors)'
        ],
        organizer: {
          name: 'Senior Mobility Healthcare Mission',
          hospital: 'Midwest Orthopedic & Spine Pavilion',
          contactPerson: 'Dr. Clara Higgins, Chief of Orthopedics'
        },
        contactInformation: {
          phone: '+1 (555) 456-7890',
          email: 'info@seniormobilitymission.org',
          helpline: '1-800-BONE-CARE'
        },
        capacity: 100,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      },
      {
        name: 'Clear Vision & Preventive Ophthalmology Camp',
        description: 'Free comprehensive eyesight testing, glaucoma pressure checks, cataract diagnoses, and refraction testing. Complimentary reading glasses provided on-site for patients with presbyopia.',
        date: addDays(14),
        startTime: '08:00 AM',
        endTime: '02:30 PM',
        location: {
          venue: 'Lakeside Community Center, West Wing',
          address: '220 Waterfront Blvd',
          city: 'Rockford',
          state: 'Illinois',
          pincode: '61101'
        },
        specialties: ['Ophthalmology', 'Optometry'],
        services: [
          'Computerized Refractive Eye Exam',
          'Intraocular Pressure (IOP) Glaucoma Check',
          'Slit-Lamp Cataract Screening',
          'Free Reading Eyeglasses Distribution',
          'Subsidized Surgery Referral for Cataracts'
        ],
        organizer: {
          name: 'Vision For All Initiative',
          hospital: 'Illinois Eye & Ear Health Institute',
          contactPerson: 'Dr. Arthur Pendelton, OD'
        },
        contactInformation: {
          phone: '+1 (555) 567-8901',
          email: 'contact@visionforall-initiative.org',
          helpline: '1-877-EYE-SEES'
        },
        capacity: 180,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      },
      {
        name: 'Diabetes, Metabolic Health & Nutrition Screening Camp',
        description: 'Focused on early diagnosis and lifestyle management of Type 2 Diabetes, pre-diabetes, and metabolic syndromes. Includes HbA1c testing, diabetic foot inspection, renal screening, and personalized diet charts.',
        date: addDays(18),
        startTime: '08:00 AM',
        endTime: '01:30 PM',
        location: {
          venue: 'Central Municipal Complex, Room 102',
          address: '100 Government Plaza',
          city: 'Springfield',
          state: 'Illinois',
          pincode: '62702'
        },
        specialties: ['Endocrinology', 'Nutrition', 'General Medicine'],
        services: [
          'Instant Blood Glucose & HbA1c Test',
          'Diabetic Neuropathy & Foot Check',
          'Kidney Function Urine Microalbumin Dipstick',
          'Personalized Dietary Plan by Registered Dietitians',
          'Glucometer Demonstration & Blood Sugar Log Kits'
        ],
        organizer: {
          name: 'Diabetes Prevention Trust',
          hospital: 'Valley Endocrinology Center',
          contactPerson: 'Dr. Sarah Lin, MD'
        },
        contactInformation: {
          phone: '+1 (555) 678-9012',
          email: 'outreach@diabetestrust.org',
          helpline: '1-800-DIABETES'
        },
        capacity: 140,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      },
      {
        name: 'Maternal & Women’s Preventive Wellness Camp',
        description: 'Compassionate and confidential women’s health clinic providing breast health examinations, cervical cancer awareness, prenatal checkups, anemia screening, and wellness consultations with board-certified gynecologists.',
        date: addDays(22),
        startTime: '09:00 AM',
        endTime: '03:00 PM',
        location: {
          venue: 'Grace Women’s Community Wellness Hub',
          address: '304 Maple Blossom Street',
          city: 'Peoria',
          state: 'Illinois',
          pincode: '61602'
        },
        specialties: ['Gynecology', 'Obstetrics', 'General Medicine', 'Nutrition'],
        services: [
          'Confidential Gynecological Consultations',
          'Clinical Breast Examination & Self-Exam Training',
          'Hemoglobin Anemia Blood Screening',
          'Prenatal Vitals & Fetal Doppler Heartbeat Check',
          'Free Iron, Folic Acid & Multivitamin Supplements'
        ],
        organizer: {
          name: 'Hope Women & Maternal Health League',
          hospital: 'Grace Memorial Women’s Pavilion',
          contactPerson: 'Dr. Priya Sharma, MD, FACOG'
        },
        contactInformation: {
          phone: '+1 (555) 789-0123',
          email: 'care@womenhealthleague.org',
          helpline: '1-800-WOMEN-WELL'
        },
        capacity: 110,
        registrationCount: 0,
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
        status: 'Upcoming'
      }
    ];

    const insertedCamps = await Camp.insertMany(demonstrationCamps);
    console.log(`[Seed] Successfully inserted ${insertedCamps.length} demonstration medical camps.`);

    // Seed realistic sample registrations for the first two camps to demonstrate dashboard and data views
    const sampleRegistrations = [
      {
        fullName: 'Jonathan Miller',
        age: 52,
        contactNumber: '+1 555-111-2233',
        email: 'jonathan.miller@example.com',
        gender: 'Male',
        address: '142 Elm Street, Springfield, IL',
        campId: insertedCamps[0]._id,
        reasonForParticipation: 'Routine cardiac checkup and blood pressure monitoring.',
        consent: true,
        registrationStatus: 'Confirmed'
      },
      {
        fullName: 'Elena Rostova',
        age: 44,
        contactNumber: '+1 555-222-3344',
        email: 'elena.rostova@example.com',
        gender: 'Female',
        address: '88 Meadow Lane, Springfield, IL',
        campId: insertedCamps[0]._id,
        reasonForParticipation: 'Family history of heart disease, seeking ECG screening.',
        consent: true,
        registrationStatus: 'Confirmed'
      },
      {
        fullName: 'David K. Washington',
        age: 63,
        contactNumber: '+1 555-333-4455',
        email: 'david.wash@example.com',
        gender: 'Male',
        address: '302 Pine Ridge, Springfield, IL',
        campId: insertedCamps[0]._id,
        reasonForParticipation: 'Shortness of breath on exertion, recommended by neighbor.',
        consent: true,
        registrationStatus: 'Confirmed'
      },
      {
        fullName: 'Sarah Jenkins',
        age: 8,
        contactNumber: '+1 555-444-5566',
        email: 'sarah.parent@example.com',
        gender: 'Female',
        address: '512 Oakwood Court, Naperville, IL',
        campId: insertedCamps[1]._id,
        reasonForParticipation: 'Annual pediatric checkup and school vision screening.',
        consent: true,
        registrationStatus: 'Confirmed'
      },
      {
        fullName: 'Lucas Chen',
        age: 6,
        contactNumber: '+1 555-555-6677',
        email: 'lchen.family@example.com',
        gender: 'Male',
        address: '94 Maple Avenue, Naperville, IL',
        campId: insertedCamps[1]._id,
        reasonForParticipation: 'Pediatric dental checkup and fluoride varnish.',
        consent: true,
        registrationStatus: 'Confirmed'
      }
    ];

    let regCount = 0;
    for (const regData of sampleRegistrations) {
      const regRef = Registration.generateReference();
      const newReg = new Registration({
        ...regData,
        registrationReference: regRef
      });
      await newReg.save();
      // Increment camp registration count
      await Camp.findByIdAndUpdate(regData.campId, { $inc: { registrationCount: 1 } });
      regCount++;
    }

    console.log(`[Seed] Seeded ${regCount} realistic sample registrations.`);
    console.log('=======================================================');
    console.log(' Medical Camp Demonstration Data Seed Complete!');
    console.log(' All records are fictional demonstration data.');
    console.log('=======================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to seed camps:', err);
    process.exit(1);
  }
};

seedCamps();
