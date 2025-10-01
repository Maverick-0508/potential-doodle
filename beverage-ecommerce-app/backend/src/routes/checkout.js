// Backend route for direct MPESA checkout payment
const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const mpesaService = require('../services/mpesaService');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Process MPESA payment for checkout
router.post('/mpesa-payment', auth, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
    .custom(value => {
      let phone = value.toString().replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '254' + phone.slice(1);
      } else if (phone.startsWith('+254')) {
        phone = phone.slice(1);
      } else if (!phone.startsWith('254')) {
        phone = '254' + phone;
      }
      
      if (!phone.match(/^254[0-9]{9}$/)) {
        throw new Error('Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    const { orderId, phoneNumber } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify order belongs to user
    if (order.user._id.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to order' 
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is already paid' 
      });
    }

    // Check M-Pesa configuration
    if (!mpesaService.isConfigured()) {
      return res.status(503).json({ 
        success: false, 
        message: 'M-Pesa service is not properly configured. Please contact support.' 
      });
    }

    // Format phone number
    let formattedPhone = phoneNumber.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    try {
      const mpesaResponse = await mpesaService.initiateSTKPush(
        formattedPhone,
        order.totalAmount,
        order._id.toString()
      );

      if (mpesaResponse.ResponseCode === '0') {
        // Update order with payment details
        order.paymentMethod = 'mpesa';
        order.paymentStatus = 'pending';
        order.mpesaDetails = {
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
          merchantRequestId: mpesaResponse.MerchantRequestID,
          phoneNumber: formattedPhone,
          amount: order.totalAmount,
          initiatedAt: new Date()
        };

        await order.save();

        res.json({
          success: true,
          message: 'Payment initiated. Check your phone for M-Pesa prompt.',
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
          merchantRequestId: mpesaResponse.MerchantRequestID,
          orderId: order._id
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: mpesaResponse.ResponseDescription || 'M-Pesa payment initiation failed' 
        });
      }
    } catch (mpesaError) {
      console.error('M-Pesa error:', mpesaError);
      res.status(400).json({ 
        success: false, 
        message: mpesaError.message || 'Payment processing failed' 
      });
    }
  } catch (error) {
    console.error('Error processing checkout payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing payment' 
    });
  }
});

// Check order payment status
router.get('/order-payment-status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to order' 
      });
    }

    // If already completed or failed, return the status
    if (order.paymentStatus === 'completed' || order.paymentStatus === 'failed') {
      return res.json({
        success: true,
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        paidAt: order.paidAt
      });
    }

    // If pending and has MPESA details, query MPESA
    if (order.paymentStatus === 'pending' && order.mpesaDetails?.checkoutRequestId) {
      try {
        const mpesaStatus = await mpesaService.querySTKPushStatus(
          order.mpesaDetails.checkoutRequestId
        );

        // Update order status based on MPESA response
        if (mpesaStatus.ResultCode === '0') {
          order.paymentStatus = 'completed';
          order.paidAt = new Date();
          order.status = 'confirmed';
          
          if (mpesaStatus.CallbackMetadata) {
            const metadata = mpesaStatus.CallbackMetadata.Item || [];
            const getMetadataValue = (name) => {
              const item = metadata.find(item => item.Name === name);
              return item ? item.Value : null;
            };

            order.mpesaDetails.mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
            order.mpesaDetails.transactionDate = getMetadataValue('TransactionDate');
            order.mpesaDetails.completedAt = new Date();
          }
        } else if (mpesaStatus.ResultCode !== '1037') { // Not pending
          order.paymentStatus = 'failed';
          order.mpesaDetails.failureReason = mpesaStatus.ResultDesc;
        }

        await order.save();

        return res.json({
          success: true,
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          paidAt: order.paidAt,
          mpesaReceiptNumber: order.mpesaDetails?.mpesaReceiptNumber
        });

      } catch (queryError) {
        console.error('Error querying MPESA status:', queryError);
        // Return current status if query fails
        return res.json({
          success: true,
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount
        });
      }
    }

    // Default response
    res.json({
      success: true,
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount
    });

  } catch (error) {
    console.error('Error checking order payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while checking payment status' 
    });
  }
});

module.exports = router;