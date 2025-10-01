import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  
  // Cart and order state
  const [cartItems, setCartItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderId, setOrderId] = useState('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load cart and wallet data
  useEffect(() => {
    if (token) {
      loadCartData();
      loadWalletBalance();
    }
  }, [token]);

  const loadCartData = () => {
    // For now, use mock cart data - replace with actual cart implementation
    const mockCart = [
      {
        id: 1,
        name: 'Coca Cola 500ml',
        price: 80,
        quantity: 2,
        image: '/images/products/coca-cola.svg'
      },
      {
        id: 2,
        name: 'Dasani Water 500ml',
        price: 50,
        quantity: 1,
        image: '/images/products/dasani-water.svg'
      }
    ];
    
    setCartItems(mockCart);
    setOrderTotal(mockCart.reduce((total, item) => total + (item.price * item.quantity), 0));
  };

  const loadWalletBalance = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.wallet?.balance || 0);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const createOrder = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: orderTotal,
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        return data.order._id;
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleMpesaPayment = async (orderIdToUse) => {
    if (!phoneNumber) {
      showSnackbar('Please enter your phone number', 'error');
      return;
    }

    const phoneRegex = /^(254|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      showSnackbar('Please enter a valid phone number (e.g., 0712345678)', 'error');
      return;
    }

    setPaymentDialog(true);
    setPaymentStatus('initiating');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/mpesa-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderIdToUse,
          phoneNumber: phoneNumber.replace(/\s+/g, '')
        })
      });

      const data = await response.json();

      if (data.success) {
        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStatus('pending');
        showSnackbar('Payment initiated. Check your phone for M-Pesa prompt.', 'success');
        
        // Start checking payment status
        startOrderStatusCheck(orderIdToUse);
      } else {
        setPaymentStatus('failed');
        showSnackbar(data.message || 'Payment initiation failed', 'error');
      }
    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      setPaymentStatus('failed');
      showSnackbar('Network error. Please try again.', 'error');
    }
  };

  const handleWalletPayment = async (orderIdToUse) => {
    if (walletBalance < orderTotal) {
      showSnackbar(`Insufficient wallet balance. You have KSh ${walletBalance} but need KSh ${orderTotal}`, 'error');
      return;
    }

    setPaymentDialog(true);
    setPaymentStatus('initiating');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderIdToUse}/pay-with-wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus('completed');
        showSnackbar('Payment successful! Your order has been placed.', 'success');
        
        // Update wallet balance
        setWalletBalance(prev => prev - orderTotal);
        
        setTimeout(() => {
          router.push(`/orders`);
        }, 2000);
      } else {
        setPaymentStatus('failed');
        showSnackbar(data.message || 'Wallet payment failed', 'error');
      }
    } catch (error) {
      console.error('Error processing wallet payment:', error);
      setPaymentStatus('failed');
      showSnackbar('Network error. Please try again.', 'error');
    }
  };

  const startOrderStatusCheck = (orderIdToCheck) => {
    let attempts = 0;
    const maxAttempts = 30; // Check for up to 5 minutes

    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setPaymentStatus('timeout');
        showSnackbar('Payment timeout. Please check your orders page.', 'warning');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/checkout/order-payment-status/${orderIdToCheck}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (data.success && (data.paymentStatus === 'completed' || data.paymentStatus === 'failed')) {
          clearInterval(interval);
          setPaymentStatus(data.paymentStatus);
          
          if (data.paymentStatus === 'completed') {
            showSnackbar('Payment successful! Your order has been placed.', 'success');
            
            setTimeout(() => {
              router.push('/orders');
            }, 2000);
          } else {
            showSnackbar('Payment failed. Please try again.', 'error');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 10000); // Check every 10 seconds

    setStatusCheckInterval(interval);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showSnackbar('Your cart is empty', 'error');
      return;
    }

    setLoading(true);

    try {
      // Create order first
      const newOrderId = await createOrder();
      setOrderId(newOrderId);

      // Process payment based on selected method
      if (paymentMethod === 'mpesa') {
        await handleMpesaPayment(newOrderId);
      } else if (paymentMethod === 'wallet') {
        await handleWalletPayment(newOrderId);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      showSnackbar(error.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closePaymentDialog = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    setPaymentDialog(false);
    setPaymentStatus(null);
    setCheckoutRequestId('');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const renderPaymentDialog = () => {
    const getDialogContent = () => {
      switch (paymentStatus) {
        case 'initiating':
          return (
            <Box textAlign="center" p={2}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">Processing Payment...</Typography>
              <Typography color="text.secondary">
                Setting up your payment request
              </Typography>
            </Box>
          );
        
        case 'pending':
          return (
            <Box textAlign="center" p={2}>
              <PhoneIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Check Your Phone
              </Typography>
              <Typography color="text.secondary" paragraph>
                An M-Pesa payment request has been sent to {phoneNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your M-Pesa PIN to complete the payment of KSh {orderTotal}
              </Typography>
              <LinearProgress sx={{ mt: 2, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Waiting for payment confirmation...
              </Typography>
            </Box>
          );
        
        case 'completed':
          return (
            <Box textAlign="center" p={2}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography color="text.secondary">
                Your order has been placed successfully. Redirecting to orders page...
              </Typography>
            </Box>
          );
        
        case 'failed':
          return (
            <Box textAlign="center" p={2}>
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" color="error.main" gutterBottom>
                Payment Failed
              </Typography>
              <Typography color="text.secondary">
                The payment could not be processed. Please try again.
              </Typography>
            </Box>
          );
        
        case 'timeout':
          return (
            <Box textAlign="center" p={2}>
              <ErrorIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" color="warning.main" gutterBottom>
                Payment Timeout
              </Typography>
              <Typography color="text.secondary">
                The payment request timed out. Please check your orders or try again.
              </Typography>
            </Box>
          );
        
        default:
          return null;
      }
    };

    return (
      <Dialog 
        open={paymentDialog} 
        onClose={paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'timeout' ? closePaymentDialog : undefined}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Payment Processing
        </DialogTitle>
        <DialogContent>
          {getDialogContent()}
        </DialogContent>
        <DialogActions>
          {(paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'timeout') && (
            <Button onClick={closePaymentDialog} variant="contained">
              Close
            </Button>
          )}
          {paymentStatus === 'pending' && (
            <Button onClick={closePaymentDialog} color="secondary">
              Cancel
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <>
      <Head>
        <title>Checkout - Beverage Store</title>
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>

        <Grid container spacing={3}>
          {/* Order Summary */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              {cartItems.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Your cart is empty
                </Typography>
              ) : (
                <List>
                  {cartItems.map((item) => (
                    <ListItem key={item.id}>
                      <ListItemAvatar>
                        <Avatar src={item.image} alt={item.name}>
                          <ShoppingCartIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={`Quantity: ${item.quantity}`}
                      />
                      <Typography variant="body1" fontWeight="bold">
                        KSh {(item.price * item.quantity).toLocaleString()}
                      </Typography>
                    </ListItem>
                  ))}
                  <Divider />
                  <ListItem>
                    <ListItemText primary={<Typography variant="h6">Total</Typography>} />
                    <Typography variant="h6" fontWeight="bold">
                      KSh {orderTotal.toLocaleString()}
                    </Typography>
                  </ListItem>
                </List>
              )}
            </Paper>

            {/* Payment Methods */}
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
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon color="primary" />
                        <Box>
                          <Typography variant="body1">M-Pesa STK Push</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pay directly from your phone
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="wallet" 
                    control={<Radio />} 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccountBalanceWalletIcon color="primary" />
                        <Box>
                          <Typography variant="body1">
                            Wallet Balance (KSh {walletBalance.toLocaleString()})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {walletBalance >= orderTotal ? 'Sufficient balance' : 'Insufficient balance'}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    disabled={walletBalance < orderTotal}
                  />
                </RadioGroup>
              </FormControl>

              {paymentMethod === 'mpesa' && (
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  sx={{ mt: 2 }}
                  disabled={loading}
                />
              )}

              {paymentMethod === 'wallet' && walletBalance < orderTotal && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You need KSh {(orderTotal - walletBalance).toLocaleString()} more in your wallet to complete this order.
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Checkout Button */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Subtotal:</Typography>
                  <Typography>KSh {orderTotal.toLocaleString()}</Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Delivery:</Typography>
                  <Typography color="success.main">Free</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    KSh {orderTotal.toLocaleString()}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0 || !token || (paymentMethod === 'wallet' && walletBalance < orderTotal)}
                  startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Processing...' : `Pay KSh ${orderTotal.toLocaleString()}`}
                </Button>

                <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                  Secure payment processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payment Status Dialog */}
        {renderPaymentDialog()}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}