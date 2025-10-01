const User = require('../models/User');

const demoUser = {
  name: process.env.DEMO_NAME || 'Demo User',
  email: process.env.DEMO_EMAIL || 'demo@beverage.local',
  phone: process.env.DEMO_PHONE || '254700000000',
  password: process.env.DEMO_PASSWORD || 'demopassword',
  isActive: true,
  wallet: { balance: 0 }
};

const seedDemoUser = async (forceReset = false) => {
  try {
    // Find by email; if env provided changed the email, also attempt to find previous demo email
    let existing = await User.findOne({ email: demoUser.email });
    if (!existing && process.env.PREV_DEMO_EMAIL) {
      existing = await User.findOne({ email: process.env.PREV_DEMO_EMAIL });
    }
    if (existing) {
      // Ensure email/phone/active state are set and optionally reset password
      let changed = false;
      if (existing.email !== demoUser.email) { existing.email = demoUser.email; changed = true; }
      if (existing.phone !== demoUser.phone) { existing.phone = demoUser.phone; changed = true; }
      if (!existing.isActive) { existing.isActive = true; changed = true; }
      // If forceReset is true, reset the password to the demo password (will be hashed by pre-save hook)
      if (forceReset) {
        existing.password = demoUser.password;
        changed = true;
      }
      if (changed) await existing.save();
      return existing;
    }

    // Create a new demo user (password will be hashed by model pre-save hook)
    const created = await User.create(demoUser);
    console.log('\u2705 Created demo user:', demoUser.email);
    return created;
  } catch (error) {
    console.error('\u274c Error creating demo user:', error);
    throw error;
  }
};

module.exports = { seedDemoUser };
