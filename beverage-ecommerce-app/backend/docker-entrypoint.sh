#!/bin/sh
# Simple entrypoint to run idempotent seeders before starting the app
set -e

echo "⚙️  Running container entrypoint: ensure seeders and permissions"

# If FORCE_SEED is true or NODE_ENV is not production, attempt to hit the seed functions
if [ "$NODE_ENV" != "production" ] || [ "$FORCE_SEED" = "true" ]; then
  echo "🌱 Seeding allowed (NODE_ENV=$NODE_ENV, FORCE_SEED=$FORCE_SEED)"
  # Run a small Node script that requires the main app code and triggers seeding
  node -e "(async ()=>{ try{ const mongoose = require('mongoose'); const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/beverage_ecommerce'; await mongoose.connect(MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true }); const seed = require('./src/seeders/productSeeder'); const userSeed = require('./src/seeders/userSeeder'); const Product = require('./src/models/Product'); const count = await Product.countDocuments(); if (count===0){ await seed.seedProducts(); console.log('✅ Products seeded by entrypoint'); } else { console.log('📦 Products already present:', count); } await userSeed.seedDemoUser(); console.log('✅ Demo user ensured by entrypoint'); process.exit(0);}catch(e){ console.error('Entrypoint seeding error', e); process.exit(0);} })();"
else
  echo "🔕 Seeding disabled for production NODE_ENV"
fi

echo "▶️  Starting application"
exec "$@"
