#!/usr/bin/env node
// Minimal entrypoint to run seeders idempotently before starting the server.
// Usage: node src/entrypoint.js

const mongoose = require('mongoose');
const { seedProducts } = require('./seeders/productSeeder');
const { seedDemoUser } = require('./seeders/userSeeder');

async function main() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:secret@mongodb:27017/beverage_ecommerce?authSource=admin';
    const maxAttempts = parseInt(process.env.MONGO_CONNECT_MAX_ATTEMPTS || '5', 10);

    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('\u2705 Entrypoint connected to MongoDB');
        break;
      } catch (err) {
        attempts++;
        console.warn(`Entrypoint: MongoDB connect attempt ${attempts} failed: ${err.message}`);
        if (attempts >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 2000 * attempts));
      }
    }

    // Run seeders
    try {
      console.log('\u2699\ufe0f Entrypoint: Running product seeder');
      await seedProducts();
    } catch (e) {
      console.error('Entrypoint: product seeder failed', e);
    }

    try {
      const forceReset = (process.env.FORCE_SEED || '').toLowerCase() === 'true';
      console.log(`\u2699\ufe0f Entrypoint: Ensuring demo user (forceReset=${forceReset})`);
      await seedDemoUser(forceReset);
    } catch (e) {
      console.error('Entrypoint: user seeder failed', e);
    }

    // Close mongoose connection - main app will open its own connection
    await mongoose.disconnect();
    console.log('\u2705 Entrypoint completed');
    process.exit(0);
  } catch (error) {
    console.error('Entrypoint error:', error);
    process.exit(1);
  }
}

main();
