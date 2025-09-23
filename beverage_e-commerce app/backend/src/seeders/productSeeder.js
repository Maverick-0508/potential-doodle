const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Coca-Cola',
    description: 'Classic refreshing cola drink',
    category: 'soda',
    brand: 'Coca-Cola',
    basePrice: 50,
    variations: [
      { size: '330ml', price: 50, stock: 100 },
      { size: '500ml', price: 70, stock: 150 },
      { size: '1L', price: 120, stock: 80 }
    ],
    rating: 4.5,
    isActive: true
  },
  {
    name: 'Dasani Water',
    description: 'Pure drinking water',
    category: 'water',
    brand: 'Coca-Cola',
    basePrice: 30,
    variations: [
      { size: '500ml', price: 30, stock: 200 },
      { size: '1L', price: 50, stock: 150 },
      { size: '1.5L', price: 70, stock: 100 }
    ],
    rating: 4.2,
    isActive: true
  },
  {
    name: 'Minute Maid Orange',
    description: 'Fresh orange juice drink',
    category: 'juice',
    brand: 'Minute Maid',
    basePrice: 80,
    variations: [
      { size: '300ml', price: 80, stock: 120 },
      { size: '500ml', price: 120, stock: 90 }
    ],
    rating: 4.7,
    isActive: true
  },
  {
    name: 'Red Bull Energy',
    description: 'Energy drink that gives you wings',
    category: 'energy',
    brand: 'Red Bull',
    basePrice: 150,
    variations: [
      { size: '250ml', price: 150, stock: 80 },
      { size: '355ml', price: 200, stock: 60 }
    ],
    rating: 4.3,
    isActive: true
  },
  {
    name: 'Lipton Ice Tea',
    description: 'Refreshing iced tea',
    category: 'tea',
    brand: 'Lipton',
    basePrice: 60,
    variations: [
      { size: '500ml', price: 60, stock: 100 }
    ],
    rating: 4.1,
    isActive: true
  },
  {
    name: 'Sprite',
    description: 'Lemon-lime flavored soda',
    category: 'soda',
    brand: 'Coca-Cola',
    basePrice: 50,
    variations: [
      { size: '330ml', price: 50, stock: 120 },
      { size: '500ml', price: 70, stock: 100 },
      { size: '1L', price: 120, stock: 60 }
    ],
    rating: 4.4,
    isActive: true
  },
  {
    name: 'Keringet Water',
    description: 'Natural mineral water from Kenya',
    category: 'water',
    brand: 'Keringet',
    basePrice: 40,
    variations: [
      { size: '500ml', price: 40, stock: 150 },
      { size: '1L', price: 70, stock: 100 }
    ],
    rating: 4.6,
    isActive: true
  },
  {
    name: 'Del Monte Pineapple',
    description: 'Sweet pineapple juice',
    category: 'juice',
    brand: 'Del Monte',
    basePrice: 90,
    variations: [
      { size: '250ml', price: 90, stock: 80 },
      { size: '500ml', price: 150, stock: 60 }
    ],
    rating: 4.5,
    isActive: true
  }
];

const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    
    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${products.length} products successfully`);
    
    return products;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

module.exports = { seedProducts, sampleProducts };