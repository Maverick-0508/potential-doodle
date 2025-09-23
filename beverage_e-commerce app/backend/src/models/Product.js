const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
});

const packetVariationSchema = new mongoose.Schema({
  packetType: {
    type: String,
    required: true,
    trim: true // e.g., "6-pack", "12-pack", "24-pack"
  },
  unitsPerPacket: {
    type: Number,
    required: true,
    min: 2 // Minimum 2 units to be considered a packet
  },
  size: {
    type: String,
    required: true,
    trim: true // Size of each individual unit in the packet
  },
  pricePerPacket: {
    type: Number,
    required: true,
    min: 0
  },
  savings: {
    type: Number,
    default: 0,
    min: 0 // Amount saved compared to buying individually
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['water', 'soda', 'juice', 'energy', 'tea', 'coffee'],
    index: true
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: 'text'
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  variations: [productVariationSchema],
  packets: [packetVariationSchema],
  image: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  totalStock: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, rating: -1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

// Calculate total stock before saving
productSchema.pre('save', function(next) {
  if (this.isModified('variations') || this.isModified('packets')) {
    const variationStock = this.variations.reduce((total, variation) => total + variation.stock, 0);
    const packetStock = this.packets.reduce((total, packet) => total + (packet.stock * packet.unitsPerPacket), 0);
    this.totalStock = variationStock + packetStock;
  }
  next();
});

// Update rating when reviews change
productSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
  } else {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);