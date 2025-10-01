import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Snackbar
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function WalletPage() {
  const { token } = useAuth();
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch wallet data on component mount
  useEffect(() => {
    if (token) {
      fetchWalletData();
    }
  }, [token]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setWalletData({
          balance: data.wallet?.balance || 0,
          transactions: data.wallet?.transactions || []
        });
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      showSnackbar('Error loading wallet data', 'error');
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || !phoneNumber) {
      showSnackbar('Please enter amount and phone number', 'error');
      return;
    }

    const amount = parseFloat(topUpAmount);
    if (amount < 1 || amount > 70000) {
      showSnackbar('Amount must be between KSh 1 and KSh 70,000', 'error');
      return;
    }

    // Validate phone number
    const phoneRegex = /^(254|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      showSnackbar('Please enter a valid phone number (e.g., 0712345678)', 'error');
      return;
    }

    setLoading(true);
    setPaymentDialog(true);
    setPaymentStatus('initiating');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          phoneNumber: phoneNumber.replace(/\s+/g, '')
        })
      });

      const data = await response.json();

      if (data.success) {
        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStatus('pending');
        showSnackbar('Payment initiated. Check your phone for M-Pesa prompt.', 'success');
        
        // Start checking payment status
        startStatusCheck(data.checkoutRequestId);
      } else {
        setPaymentStatus('failed');
        showSnackbar(data.message || 'Payment initiation failed', 'error');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentStatus('failed');
      showSnackbar('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startStatusCheck = (requestId) => {
    let attempts = 0;
    const maxAttempts = 30; // Check for up to 5 minutes

    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setPaymentStatus('timeout');
        showSnackbar('Payment timeout. Please check your transaction history.', 'warning');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/payment-status/${requestId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (data.success && (data.status === 'completed' || data.status === 'failed')) {
          clearInterval(interval);
          setPaymentStatus(data.status);
          
          if (data.status === 'completed') {
            showSnackbar(`Payment successful! KSh ${data.amount} added to wallet.`, 'success');
            fetchWalletData(); // Refresh wallet data
            
            // Reset form
            setTopUpAmount('');
            setPhoneNumber('');
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

  const getTransactionIcon = (type) => {
    return type === 'credit' ? (
      <ArrowUpwardIcon color="success" />
    ) : (
      <ArrowDownwardIcon color="error" />
    );
  };

  const getStatusColor = (type) => {
    return type === 'credit' ? 'success' : 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPaymentDialog = () => {
    const getDialogContent = () => {
      switch (paymentStatus) {
        case 'initiating':
          return (
            <Box textAlign="center" p={2}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">Initiating Payment...</Typography>
              <Typography color="text.secondary">
                Setting up your M-Pesa payment request
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
                Enter your M-Pesa PIN to complete the payment of KSh {topUpAmount}
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
                KSh {topUpAmount} has been added to your wallet
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
                The payment request timed out. Please check your transaction history or try again.
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
          M-Pesa Payment
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
        <title>My Wallet - Beverage Store</title>
      </Head>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Wallet
        </Typography>

        {/* Wallet Balance Card */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h3" gutterBottom>
              KSh {walletData.balance.toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Available Balance
            </Typography>
          </CardContent>
        </Card>

        {/* Top Up Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Up Wallet via M-Pesa
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Add money to your wallet using M-Pesa. Enter amount (KSh 1 - KSh 70,000) and phone number.
          </Alert>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Amount (KSh)"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                inputProps={{ min: 1, max: 70000 }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone Number"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleTopUp}
                disabled={loading || !token}
                startIcon={<AddIcon />}
              >
                {loading ? 'Processing...' : 'Top Up'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Recent Transactions */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          
          {walletData.transactions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No transactions yet. Top up your wallet to get started!
            </Typography>
          ) : (
            <List>
              {walletData.transactions.slice(0, 10).map((transaction, index) => (
                <React.Fragment key={transaction._id || index}>
                  <ListItem>
                    <Box sx={{ mr: 2 }}>
                      {getTransactionIcon(transaction.type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1">
                            {transaction.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="body1"
                              color={getStatusColor(transaction.type)}
                              fontWeight="bold"
                            >
                              {transaction.type === 'credit' ? '+' : '-'}KSh {transaction.amount.toLocaleString()}
                            </Typography>
                            <Chip
                              label={transaction.status || 'completed'}
                              size="small"
                              color={transaction.status === 'completed' ? 'success' : 
                                     transaction.status === 'pending' ? 'warning' : 'error'}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(transaction.timestamp || transaction.date)}
                          </Typography>
                          {transaction.mpesaDetails?.mpesaReceiptNumber && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              M-Pesa ID: {transaction.mpesaDetails.mpesaReceiptNumber}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < walletData.transactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

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