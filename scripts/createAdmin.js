require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_camp_portal';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for Admin creation...');

    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@medicalcamp.org';
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@12345';
    const defaultUsername = 'admin';
    const defaultName = process.env.ADMIN_DEFAULT_NAME || 'Chief Medical Administrator';

    let admin = await Admin.findOne({ email: defaultEmail });

    if (admin) {
      console.log(`[Seed] Administrator account "${defaultEmail}" already exists.`);
      console.log('If you need to reset the password, update it in MongoDB directly or delete this user.');
    } else {
      admin = new Admin({
        username: defaultUsername,
        email: defaultEmail,
        password: defaultPassword, // Will be hashed by Mongoose pre-save hook
        fullName: defaultName,
        role: 'superadmin'
      });

      await admin.save();
      console.log('=======================================================');
      console.log(' Initial Administrator Created Successfully!');
      console.log(` Username : ${defaultUsername}`);
      console.log(` Email    : ${defaultEmail}`);
      console.log(` Password : ${defaultPassword}`);
      console.log(` Role     : superadmin`);
      console.log(' NOTE     : Change this password after initial deployment.');
      console.log('=======================================================');
    }

    await mongoose.connection.close();
    console.log('[Seed] Disconnected from MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error] Failed to create administrator:', err);
    process.exit(1);
  }
};

createAdmin();
