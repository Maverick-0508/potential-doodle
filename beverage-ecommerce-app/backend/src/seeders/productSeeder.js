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
    packets: [
      { 
        packetType: '6-pack', 
        unitsPerPacket: 6, 
        size: '330ml', 
        pricePerPacket: 280, 
        savings: 20, 
        stock: 50 
      },
      { 
        packetType: '12-pack', 
        unitsPerPacket: 12, 
        size: '330ml', 
        pricePerPacket: 540, 
        savings: 60, 
        stock: 30 
      },
      { 
        packetType: '6-pack', 
        unitsPerPacket: 6, 
        size: '500ml', 
        pricePerPacket: 390, 
        savings: 30, 
        stock: 40 
      }
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
    packets: [
      { 
        packetType: '6-pack', 
        unitsPerPacket: 6, 
        size: '500ml', 
        pricePerPacket: 160, 
        savings: 20, 
        stock: 60 
      },
      { 
        packetType: '12-pack', 
        unitsPerPacket: 12, 
        size: '500ml', 
        pricePerPacket: 300, 
        savings: 60, 
        stock: 40 
      },
      { 
        packetType: '24-pack', 
        unitsPerPacket: 24, 
        size: '500ml', 
        pricePerPacket: 576, 
        savings: 144, 
        stock: 20 
      }
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
    packets: [
      { 
        packetType: '4-pack', 
        unitsPerPacket: 4, 
        size: '300ml', 
        pricePerPacket: 300, 
        savings: 20, 
        stock: 30 
      },
      { 
        packetType: '6-pack', 
        unitsPerPacket: 6, 
        size: '300ml', 
        pricePerPacket: 450, 
        savings: 30, 
        stock: 25 
      }
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
    packets: [
      { 
        packetType: '4-pack', 
        unitsPerPacket: 4, 
        size: '250ml', 
        pricePerPacket: 570, 
        savings: 30, 
        stock: 25 
      },
      { 
        packetType: '8-pack', 
        unitsPerPacket: 8, 
        size: '250ml', 
        pricePerPacket: 1080, 
        savings: 120, 
        stock: 15 
      }
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
    const results = [];

    for (const p of sampleProducts) {
      // Upsert by name to make seeding idempotent
      const existing = await Product.findOne({ name: p.name });
      if (existing) {
        // Update fields that may have changed
        existing.description = p.description;
        existing.category = p.category;
        existing.brand = p.brand;
        existing.basePrice = p.basePrice;
        existing.variations = p.variations;
        existing.packets = p.packets || existing.packets;
        existing.rating = p.rating;
        existing.isActive = p.isActive !== undefined ? p.isActive : existing.isActive;
        await existing.save();
        results.push(existing);
      } else {
        const created = await Product.create(p);
        results.push(created);
      }
    }

    console.log(`✅ Seeded/Updated ${results.length} products successfully`);
    return results;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

module.exports = { seedProducts, sampleProducts };