# M-Pesa Configuration Guide

This guide will help you set up M-Pesa integration for your beverage e-commerce application.

## Prerequisites

1. **Safaricom Developer Account** - You need an account at https://developer.safaricom.co.ke
2. **Test Phone Number** - A Safaricom phone number for testing
3. **Production Business** - For live transactions, you need a registered business with Safaricom

## Step 1: Create M-Pesa Developer Account

1. Visit https://developer.safaricom.co.ke
2. Click "Sign Up" and create your account
3. Verify your email address
4. Log in to your developer portal

## Step 2: Create a New App

1. In the developer portal, click "Create New App"
2. Fill in your app details:
   - **App Name**: Beverage E-Commerce
   - **Description**: Online beverage store with M-Pesa payments
3. Select the APIs you need:
   - ✅ **M-Pesa Sandbox** (for testing)
   - ✅ **Lipa na M-Pesa Online** (STK Push)
4. Click "Create App"

## Step 3: Get Your Credentials

After creating your app, you'll receive:

### Sandbox Credentials
- **Consumer Key**: Used for authentication
- **Consumer Secret**: Used for authentication  
- **Test Credentials**: For sandbox testing

### Important URLs
- **Sandbox Base URL**: `https://sandbox.safaricom.co.ke`
- **Production Base URL**: `https://api.safaricom.co.ke`

## Step 4: Configure Your Environment

Edit your `backend/.env` file with your M-Pesa credentials:

```env
# M-Pesa Configuration (Sandbox)
MPESA_CONSUMER_KEY=your_actual_consumer_key
MPESA_CONSUMER_SECRET=your_actual_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-domain.com/api
MPESA_ENVIRONMENT=sandbox
```

### Default Sandbox Values
- **Shortcode**: `174379` (Safaricom test shortcode)
- **Passkey**: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

## Step 5: Test Phone Numbers

For sandbox testing, use these Safaricom test numbers:
- `254708374149`
- `254711111111` 
- `254722000000`

## Step 6: Callback URL Setup

For development, you need a public URL for M-Pesa callbacks:

### Option 1: Ngrok (Recommended for Development)
```bash
# Install ngrok
npm install -g ngrok

# Start your backend server
npm run dev

# In another terminal, expose your local server
ngrok http 5000

# Use the https URL from ngrok as your callback URL
# Example: https://abc123.ngrok.io/api
```

### Option 2: Use a Test Callback URL
For initial testing, you can use a test URL service like:
- `https://webhook.site` - Provides a temporary URL for testing

## Step 7: Update Environment Variables

Update your `.env` file with the ngrok URL:

```env
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api
```

## Step 8: Test the Integration

1. **Start your servers**:
   ```bash
   # Use VS Code task or manually:
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

2. **Test wallet top-up**:
   - Go to http://localhost:3000/wallet
   - Enter amount and test phone number
   - Click "Top Up with M-Pesa"
   - Check your test phone for STK push prompt

3. **Test order payment**:
   - Add items to cart
   - Go to checkout
   - Select M-Pesa payment
   - Complete the payment flow

## Production Setup

When ready for production:

1. **Get Production Credentials**:
   - Apply for production access in the developer portal
   - Provide business registration documents
   - Get approved by Safaricom

2. **Update Environment**:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_SHORTCODE=your_production_shortcode
   MPESA_CALLBACK_URL=https://your-production-domain.com/api
   ```

## Troubleshooting

### Common Issues

1. **"Invalid Credentials" Error**
   - Double-check consumer key and secret
   - Ensure no extra spaces in environment variables

2. **"Invalid Shortcode" Error**  
   - Use `174379` for sandbox
   - Check your production shortcode

3. **"Callback URL not reachable" Error**
   - Ensure ngrok is running
   - Check firewall settings
   - Verify URL is accessible publicly

4. **"Insufficient Funds" in Sandbox**
   - Use test phone numbers provided by Safaricom
   - Sandbox has unlimited test funds

### Logs and Debugging

Check your backend console for M-Pesa API responses:
```bash
# Backend logs will show:
M-Pesa STK Push Response: { ResponseCode: '0', ... }
M-Pesa Callback: { success: true, amount: 100, ... }
```

## Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- Validate all callback data
- Implement proper error handling
- Log transactions for auditing

## Support

- **Safaricom Developer Support**: developers@safaricom.co.ke
- **Documentation**: https://developer.safaricom.co.ke/docs
- **Community**: Safaricom Developer Portal forums