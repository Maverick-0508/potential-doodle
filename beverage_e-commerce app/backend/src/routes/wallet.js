const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mpesaService = require('../services/mpesaService');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get wallet balance
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      wallet: user.wallet,
      balance: user.wallet.balance,
      currency: 'KES'
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching wallet' 
    });
  }
});

// Top up wallet with M-Pesa
router.post('/topup', auth, [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => {
      if (value < 1 || value > 70000) {
        throw new Error('Amount must be between KSh 1 and KSh 70,000');
      }
      return true;
    }),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(value => {
      // Validate phone number format
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

    const { amount, phoneNumber } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
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

    const orderId = `WALLET_${user._id}_${Date.now()}`;

    try {
      const mpesaResponse = await mpesaService.initiateSTKPush(
        formattedPhone,
        parseFloat(amount),
        orderId
      );

      if (mpesaResponse.ResponseCode === '0') {
        // Store pending transaction
        user.wallet.transactions.push({
          type: 'credit',
          amount: parseFloat(amount),
          description: 'Wallet Top-up via M-Pesa',
          status: 'pending',
          mpesaDetails: {
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            merchantRequestId: mpesaResponse.MerchantRequestID,
            phoneNumber: formattedPhone
          }
        });

        await user.save();

        res.json({
          success: true,
          message: 'Wallet top-up initiated. Check your phone for M-Pesa prompt.',
          checkoutRequestId: mpesaResponse.CheckoutRequestID,
          merchantRequestId: mpesaResponse.MerchantRequestID
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
    console.error('Error topping up wallet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing payment' 
    });
  }
});

// Check payment status
router.get('/payment-status/:checkoutRequestId', auth, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Checkout request ID is required' 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find the transaction
    const transaction = user.wallet.transactions.find(
      tx => tx.mpesaDetails?.checkoutRequestId === checkoutRequestId
    );

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // If already completed, return the status
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      return res.json({
        success: true,
        status: transaction.status,
        amount: transaction.amount,
        timestamp: transaction.timestamp
      });
    }

    try {
      // Query M-Pesa for status
      const statusResponse = await mpesaService.querySTKPushStatus(checkoutRequestId);
      
      let status = 'pending';
      if (statusResponse.ResultCode === '0') {
        status = 'completed';
      } else if (statusResponse.ResultCode && statusResponse.ResultCode !== '1032') {
        // 1032 means request is still being processed
        status = 'failed';
      }

      res.json({
        success: true,
        status,
        resultCode: statusResponse.ResultCode,
        resultDesc: statusResponse.ResultDesc,
        amount: transaction.amount
      });

    } catch (statusError) {
      console.error('Error checking M-Pesa status:', statusError);
      res.json({
        success: true,
        status: 'pending',
        message: 'Unable to check status, payment may still be processing'
      });
    }

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while checking payment status' 
    });
  }
});

// Get wallet transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pagination parameters' 
      });
    }

    const user = await User.findById(req.userId).select('wallet.transactions wallet.balance');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const sortedTransactions = user.wallet.transactions
      .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const transactions = sortedTransactions.slice(startIndex, endIndex);

    // Remove sensitive data from response
    const sanitizedTransactions = transactions.map(tx => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      status: tx.status,
      timestamp: tx.createdAt || tx.timestamp
    }));

    const total = user.wallet.transactions.length;

    res.json({
      success: true,
      transactions: sanitizedTransactions,
      currentBalance: user.wallet.balance,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalTransactions: total,
        hasMore: endIndex < total
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching transactions' 
    });
  }
});

// M-Pesa wallet callback
router.post('/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Wallet Callback received:', JSON.stringify(req.body, null, 2));

    const callbackResult = mpesaService.handleCallback(req.body);
    
    if (!callbackResult.checkoutRequestId) {
      console.error('No checkout request ID in callback');
      return res.status(400).json({ 
        ResultCode: 1, 
        ResultDesc: 'Invalid callback data' 
      });
    }

    // Find user with this transaction
    const user = await User.findOne({
      'wallet.transactions.mpesaDetails.checkoutRequestId': callbackResult.checkoutRequestId
    });

    if (!user) {
      console.error('No user found for checkout request ID:', callbackResult.checkoutRequestId);
      return res.status(404).json({ 
        ResultCode: 1, 
        ResultDesc: 'Transaction not found' 
      });
    }

    // Find the specific transaction
    const transaction = user.wallet.transactions.find(
      tx => tx.mpesaDetails?.checkoutRequestId === callbackResult.checkoutRequestId
    );

    if (!transaction) {
      console.error('Transaction not found in user wallet');
      return res.status(404).json({ 
        ResultCode: 1, 
        ResultDesc: 'Transaction not found' 
      });
    }

    if (callbackResult.success) {
      // Payment successful
      if (transaction.status !== 'completed') {
        transaction.status = 'completed';
        transaction.mpesaDetails.mpesaReceiptNumber = callbackResult.mpesaReceiptNumber;
        transaction.mpesaDetails.transactionDate = callbackResult.transactionDate;
        
        // Add money to wallet
        user.wallet.balance += transaction.amount;
        
        console.log(`Wallet topped up for user ${user._id}: KSh ${transaction.amount}`);
      }
    } else {
      // Payment failed
      transaction.status = 'failed';
      transaction.mpesaDetails.errorCode = callbackResult.errorCode;
      transaction.mpesaDetails.errorMessage = callbackResult.errorMessage;
      
      console.log(`Wallet top-up failed for user ${user._id}: ${callbackResult.errorMessage}`);
    }

    await user.save();

    res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processed successfully' 
    });

  } catch (error) {
    console.error('M-Pesa wallet callback error:', error);
    res.status(500).json({ 
      ResultCode: 1, 
      ResultDesc: 'Server error processing callback' 
    });
  }
});

// Get M-Pesa configuration status (for debugging)
router.get('/mpesa/config', auth, async (req, res) => {
  try {
    const configStatus = mpesaService.getConfigStatus();
    
    res.json({
      success: true,
      configured: configStatus.configured,
      environment: configStatus.environment,
      missingConfig: {
        consumerKey: !configStatus.hasConsumerKey,
        consumerSecret: !configStatus.hasConsumerSecret,
        shortcode: !configStatus.hasShortcode,
        passkey: !configStatus.hasPasskey,
        callbackUrl: !configStatus.hasCallbackUrl
      }
    });
  } catch (error) {
    console.error('Error getting M-Pesa config status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking configuration' 
    });
  }
});

module.exports = router;