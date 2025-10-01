// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Create the beverage_ecommerce database
db = db.getSiblingDB('beverage_ecommerce');

// Create indexes for better performance
db.products.createIndex({ "name": "text", "brand": "text", "description": "text" });
db.products.createIndex({ "category": 1, "isActive": 1 });
db.products.createIndex({ "isActive": 1, "rating": -1 });
db.products.createIndex({ "isActive": 1, "createdAt": -1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phoneNumber": 1 }, { unique: true });

db.orders.createIndex({ "user": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });

// Create admin user (optional)
db.users.insertOne({
    name: "Admin User",
    email: "admin@beveragehub.com",
    password: "$2a$10$dummy.hash.for.development.only",
    role: "admin",
    isVerified: true,
    phoneNumber: "+254758827319",
    createdAt: new Date(),
    updatedAt: new Date()
});

print('✅ MongoDB initialization complete');
print('📊 Database: beverage_ecommerce');
print('👤 Admin user created: admin@beveragehub.com');
print('🔍 Indexes created for optimal performance');