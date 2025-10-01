const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variation: {
    size: String,
    price: Number
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 60
  },
  finalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    county: { type: String, required: true },
    postalCode: String,
    phoneNumber: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paidAt: Date,
  mpesaDetails: {
    checkoutRequestId: String,
    merchantRequestId: String,
    mpesaReceiptNumber: String,
    transactionDate: String,
    phoneNumber: String,
    amount: Number,
    initiatedAt: Date,
    completedAt: Date,
    failureReason: String
  },
  mpesaTransactionId: String, // Deprecated, use mpesaDetails.mpesaReceiptNumber
  orderStatus: {
    type: String,
    alias: 'status',
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  estimatedDeliveryTime: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);