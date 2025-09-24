import React from 'react';
import { useState } from 'react';
import Head from 'next/head';
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
  Alert
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const walletTransactions = [
  {
    id: 1,
    type: 'credit',
    amount: 500,
    description: 'M-Pesa wallet top-up',
    date: '2025-09-20T10:30:00',
    mpesaId: 'OEI2AK4J60'
  },
  {
    id: 2,
    type: 'debit',
    amount: 280,
    description: 'Payment for order ORD001',
    date: '2025-09-20T14:15:00'
  },
  {
    id: 3,
    type: 'credit',
    amount: 1000,
    description: 'M-Pesa wallet top-up',
    date: '2025-09-18T09:45:00',
    mpesaId: 'OEI2AK4J59'
  },
  {
    id: 4,
    type: 'debit',
    amount: 420,
    description: 'Payment for order ORD002',
    date: '2025-09-18T16:20:00'
  }
];

export default function WalletPage() {
  const [walletBalance] = useState(800);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleTopUp = () => {
    // TODO: Integrate with backend API
    console.log('Top up wallet:', { amount: topUpAmount, phone: phoneNumber });
    alert('M-Pesa top-up initiated. Check your phone for the payment prompt.');
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
              KSh {walletBalance.toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Available Balance
            </Typography>
          </CardContent>
        </Card>

        {/* Top Up Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Up Wallet
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Add money to your wallet using M-Pesa for faster checkout
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (KSh)"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                inputProps={{ min: 10 }}
                helperText="Minimum: KSh 10"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="M-Pesa Phone Number"
                placeholder="254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Grid>
          </Grid>
          
          {/* Quick Amount Buttons */}
          <Box mt={2} mb={3}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Quick amounts:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {[100, 200, 500, 1000, 2000].map((amount) => (
                <Chip
                  key={amount}
                  label={`KSh ${amount}`}
                  clickable
                  onClick={() => setTopUpAmount(amount.toString())}
                  color={topUpAmount === amount.toString() ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleTopUp}
            disabled={!topUpAmount || !phoneNumber || parseFloat(topUpAmount) < 10}
            size="large"
          >
            Top Up with M-Pesa
          </Button>
        </Paper>

        {/* Transaction History */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          
          <List>
            {walletTransactions.map((transaction, index) => (
              <React.Fragment key={transaction.id}>
                <ListItem sx={{ px: 0 }}>
                  <Box display="flex" alignItems="center" mr={2}>
                    {transaction.type === 'credit' ? (
                      <ArrowDownwardIcon color="success" />
                    ) : (
                      <ArrowUpwardIcon color="error" />
                    )}
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">
                          {transaction.description}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {transaction.type === 'credit' ? '+' : '-'}KSh {transaction.amount}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(transaction.date).toLocaleString()}
                        </Typography>
                        {transaction.mpesaId && (
                          <Chip 
                            label={`M-Pesa: ${transaction.mpesaId}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                
                {index < walletTransactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          <Box textAlign="center" mt={2}>
            <Button variant="outlined">
              View All Transactions
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}