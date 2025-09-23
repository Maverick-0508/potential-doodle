const axios = require('axios');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    // Validate required configuration
    this.validateConfig();
  }

  validateConfig() {
    const requiredFields = ['consumerKey', 'consumerSecret', 'shortcode', 'passkey', 'callbackUrl'];
    const missing = requiredFields.filter(field => !this[field]);
    
    if (missing.length > 0) {
      console.warn(`⚠️  Missing M-Pesa configuration: ${missing.join(', ')}`);
      console.warn('M-Pesa payments will not work properly. Please check your .env file.');
    }
  }

  async getAccessToken() {
    try {
      if (!this.consumerKey || !this.consumerSecret) {
        throw new Error('M-Pesa consumer key and secret are required');
      }

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (!response.data.access_token) {
        throw new Error('No access token received from M-Pesa');
      }
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa. Please check your credentials.');
    }
  }

  async initiateSTKPush(phoneNumber, amount, orderId) {
    try {
      // Validate inputs
      if (!phoneNumber || !amount || !orderId) {
        throw new Error('Phone number, amount, and order ID are required');
      }

      // Validate phone number format
      if (!phoneNumber.match(/^254[0-9]{9}$/)) {
        throw new Error('Invalid phone number format. Use 254XXXXXXXXX');
      }

      // Validate amount
      if (amount < 1 || amount > 70000) {
        throw new Error('Amount must be between KSh 1 and KSh 70,000');
      }

      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // Ensure integer
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${this.callbackUrl}/mpesa/callback`,
        AccountReference: `ORDER_${orderId}`.substring(0, 12), // Max 12 chars
        TransactionDesc: `BeverageHub Order Payment`.substring(0, 13) // Max 13 chars
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for STK push
        }
      );

      console.log('M-Pesa STK Push Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initiating M-Pesa STK Push:', error.response?.data || error.message);
      if (error.response?.data) {
        throw new Error(error.response.data.errorMessage || 'M-Pesa payment initiation failed');
      }
      throw error;
    }
  }

  async querySTKPushStatus(checkoutRequestId) {
    try {
      if (!checkoutRequestId) {
        throw new Error('Checkout request ID is required');
      }

      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

      const requestData = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('M-Pesa Query Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error querying M-Pesa STK Push status:', error.response?.data || error.message);
      throw error;
    }
  }

  // Handle M-Pesa callback with enhanced error handling
  handleCallback(callbackData) {
    try {
      if (!callbackData || !callbackData.Body) {
        throw new Error('Invalid callback data structure');
      }

      const { Body } = callbackData;
      const { stkCallback } = Body;
      
      if (!stkCallback) {
        throw new Error('Missing STK callback data');
      }

      console.log('Processing M-Pesa callback:', JSON.stringify(stkCallback, null, 2));
      
      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const metadata = stkCallback.CallbackMetadata?.Item || [];
        
        const getMetadataValue = (name) => {
          const item = metadata.find(item => item.Name === name);
          return item ? item.Value : null;
        };

        const amount = getMetadataValue('Amount');
        const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
        const transactionDate = getMetadataValue('TransactionDate');
        const phoneNumber = getMetadataValue('PhoneNumber');

        if (!amount || !mpesaReceiptNumber) {
          throw new Error('Missing required payment metadata');
        }

        return {
          success: true,
          amount: parseFloat(amount),
          mpesaReceiptNumber,
          transactionDate,
          phoneNumber,
          checkoutRequestId: stkCallback.CheckoutRequestID
        };
      } else {
        // Payment failed
        return {
          success: false,
          errorCode: stkCallback.ResultCode,
          errorMessage: stkCallback.ResultDesc || 'Payment failed',
          checkoutRequestId: stkCallback.CheckoutRequestID
        };
      }
    } catch (error) {
      console.error('Error processing M-Pesa callback:', error);
      return {
        success: false,
        errorCode: 'CALLBACK_ERROR',
        errorMessage: error.message,
        checkoutRequestId: callbackData?.Body?.stkCallback?.CheckoutRequestID || null
      };
    }
  }

  // Check if M-Pesa is properly configured
  isConfigured() {
    return !!(this.consumerKey && this.consumerSecret && this.shortcode && this.passkey);
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      environment: this.environment,
      baseUrl: this.baseUrl,
      configured: this.isConfigured(),
      hasConsumerKey: !!this.consumerKey,
      hasConsumerSecret: !!this.consumerSecret,
      hasShortcode: !!this.shortcode,
      hasPasskey: !!this.passkey,
      hasCallbackUrl: !!this.callbackUrl
    };
  }
}

module.exports = new MpesaService();