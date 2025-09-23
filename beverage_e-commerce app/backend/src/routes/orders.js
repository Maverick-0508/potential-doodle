const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mpesaService = require('../services/mpesaService');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create new order
router.post('/', auth, [
  body('items').isArray().withMessage('Items must be an array'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('paymentMethod').isIn(['mpesa', 'card', 'wallet']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, deliveryAddress, paymentMethod, mpesaNumber } = req.body;
    const user = await User.findById(req.userId);

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 60; // Fixed delivery fee
    const finalAmount = totalAmount + deliveryFee;

    // Create order
    const order = new Order({
      user: req.userId,
      items,
      totalAmount,
      deliveryFee,
      finalAmount,
      deliveryAddress,
      paymentMethod
    });

    await order.save();

    // Handle payment based on method
    if (paymentMethod === 'mpesa') {
      try {
        const mpesaResponse = await mpesaService.initiateSTKPush(
          mpesaNumber,
          finalAmount,
          order._id
        );

        if (mpesaResponse.ResponseCode === '0') {
          order.mpesaTransactionId = mpesaResponse.CheckoutRequestID;
          await order.save();

          res.json({
            message: 'Order created successfully. Check your phone for M-Pesa prompt.',
            order: order._id,
            mpesaCheckoutRequestId: mpesaResponse.CheckoutRequestID
          });
        } else {
          await Order.findByIdAndDelete(order._id);
          res.status(400).json({ message: 'M-Pesa payment initiation failed' });
        }
      } catch (mpesaError) {
        await Order.findByIdAndDelete(order._id);
        console.error('M-Pesa error:', mpesaError);
        res.status(500).json({ message: 'Payment processing failed' });
      }
    } else if (paymentMethod === 'wallet') {
      if (user.wallet.balance >= finalAmount) {
        user.wallet.balance -= finalAmount;
        user.wallet.transactions.push({
          type: 'debit',
          amount: finalAmount,
          description: `Payment for order ${order._id}`
        });
        await user.save();

        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        await order.save();

        res.json({
          message: 'Order placed successfully using wallet',
          order: order._id
        });
      } else {
        await Order.findByIdAndDelete(order._id);
        res.status(400).json({ message: 'Insufficient wallet balance' });
      }
    } else {
      // Card payment (placeholder)
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
      await order.save();

      res.json({
        message: 'Order placed successfully',
        order: order._id
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.userId })
      .populate('items.product', 'name brand image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ user: req.userId });

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    }).populate('items.product', 'name brand image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// M-Pesa callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    const result = mpesaService.handleCallback(callbackData);

    if (result.success) {
      // Find order by checkout request ID
      const order = await Order.findOne({ 
        mpesaTransactionId: result.checkoutRequestId 
      });

      if (order) {
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        order.mpesaTransactionId = result.mpesaReceiptNumber;
        await order.save();

        console.log(`Order ${order._id} payment confirmed via M-Pesa`);
      }
    } else {
      // Handle failed payment
      const order = await Order.findOne({ 
        mpesaTransactionId: result.checkoutRequestId 
      });

      if (order) {
        order.paymentStatus = 'failed';
        await order.save();

        console.log(`Order ${order._id} payment failed: ${result.errorMessage}`);
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;