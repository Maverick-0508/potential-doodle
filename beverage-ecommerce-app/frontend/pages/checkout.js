import React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert
} from '@mui/material';

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  const orderTotal = 250; // Example total

  const handleMpesaPayment = () => {
    // TODO: Integrate with M-Pesa API
    console.log('Processing M-Pesa payment for:', mpesaNumber);
    alert('M-Pesa payment initiated. Check your phone for the payment prompt.');
  };

  const handleCardPayment = () => {
    // TODO: Integrate with card payment processor
    console.log('Processing card payment');
    alert('Card payment processed successfully!');
  };

  return (
    <>
      <Head>
        <title>Checkout - Beverage Store</title>
      </Head>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Coca-Cola 500ml x2</Typography>
            <Typography>KSh 140</Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Dasani Water 1L x1</Typography>
            <Typography>KSh 50</Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Delivery Fee</Typography>
            <Typography>KSh 60</Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">KSh {orderTotal}</Typography>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Method
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel 
                value="mpesa" 
                control={<Radio />} 
                label="M-Pesa Mobile Money" 
              />
              <FormControlLabel 
                value="card" 
                control={<Radio />} 
                label="Credit/Debit Card" 
              />
              <FormControlLabel 
                value="wallet" 
                control={<Radio />} 
                label="In-App Wallet (KSh 150 available)" 
              />
            </RadioGroup>
          </FormControl>

          {paymentMethod === 'mpesa' && (
            <Box mt={3}>
              <Alert severity="info" sx={{ mb: 2 }}>
                You will receive an M-Pesa prompt on your phone to complete the payment.
              </Alert>
              <TextField
                fullWidth
                label="M-Pesa Phone Number"
                placeholder="254712345678"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                helperText="Enter your M-Pesa registered phone number"
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleMpesaPayment}
                disabled={!mpesaNumber}
              >
                Pay with M-Pesa - KSh {orderTotal}
              </Button>
            </Box>
          )}

          {paymentMethod === 'card' && (
            <Box mt={3}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="MM/YY"
                  placeholder="12/25"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                />
                <TextField
                  label="CVV"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                />
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleCardPayment}
              >
                Pay with Card - KSh {orderTotal}
              </Button>
            </Box>
          )}

          {paymentMethod === 'wallet' && (
            <Box mt={3}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Insufficient wallet balance. Please top up your wallet or choose another payment method.
              </Alert>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 1 }}
              >
                Top Up Wallet with M-Pesa
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                disabled
              >
                Pay with Wallet - KSh {orderTotal}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
}