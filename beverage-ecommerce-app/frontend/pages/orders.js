import React from 'react';
import { useState } from 'react';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';

const favoriteOrders = [
  {
    id: 1,
    name: "Weekend Refresh",
    items: [
      { name: "Coca-Cola 500ml", quantity: 2 },
      { name: "Dasani Water 1L", quantity: 1 }
    ],
    totalAmount: 190,
    lastOrdered: "2025-09-15"
  },
  {
    id: 2,
    name: "Energy Boost",
    items: [
      { name: "Red Bull 250ml", quantity: 3 },
      { name: "Monster Energy 500ml", quantity: 1 }
    ],
    totalAmount: 450,
    lastOrdered: "2025-09-10"
  }
];

const recentOrders = [
  {
    id: 'ORD001',
    date: '2025-09-20',
    status: 'delivered',
    items: 3,
    total: 280
  },
  {
    id: 'ORD002',
    date: '2025-09-18',
    status: 'out_for_delivery',
    items: 5,
    total: 420
  },
  {
    id: 'ORD003',
    date: '2025-09-15',
    status: 'delivered',
    items: 2,
    total: 190
  }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'delivered': return 'success';
    case 'out_for_delivery': return 'warning';
    case 'preparing': return 'info';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'delivered': return 'Delivered';
    case 'out_for_delivery': return 'Out for Delivery';
    case 'preparing': return 'Preparing';
    case 'confirmed': return 'Confirmed';
    case 'cancelled': return 'Cancelled';
    default: return 'Pending';
  }
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('recent');

  return (
    <>
      <Head>
        <title>My Orders - Beverage Store</title>
      </Head>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Orders
        </Typography>

        {/* Tab Navigation */}
        <Box display="flex" gap={1} mb={3}>
          <Button
            variant={activeTab === 'recent' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('recent')}
          >
            Recent Orders
          </Button>
          <Button
            variant={activeTab === 'favorites' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('favorites')}
          >
            Favorite Orders
          </Button>
        </Box>

        {/* Recent Orders Tab */}
        {activeTab === 'recent' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            
            {recentOrders.map((order) => (
              <Card key={order.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Order #{order.id}
                    </Typography>
                    <Chip 
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography>
                        {new Date(order.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Items
                      </Typography>
                      <Typography>
                        {order.items} items
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography>
                        KSh {order.total}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Box display="flex" gap={1} flexDirection="column">
                        <Button size="small" variant="outlined">
                          View Details
                        </Button>
                        <Button size="small" variant="text">
                          Reorder
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Favorite Orders Tab */}
        {activeTab === 'favorites' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Favorite Orders
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Quick reorder your favorite combinations
            </Typography>
            
            {favoriteOrders.map((favorite) => (
              <Card key={favorite.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {favorite.name}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      KSh {favorite.totalAmount}
                    </Typography>
                  </Box>
                  
                  <List dense>
                    {favorite.items.map((item, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={`${item.quantity}x ${item.name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Last ordered: {new Date(favorite.lastOrdered).toLocaleDateString()}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button size="small" variant="outlined">
                        Edit
                      </Button>
                      <Button size="small" variant="contained">
                        Reorder
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
            
            <Box textAlign="center" mt={3}>
              <Button variant="outlined" size="large">
                Create New Favorite Order
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}