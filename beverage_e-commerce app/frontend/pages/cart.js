import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cartData, setCartData] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Load cart data from localStorage
    const storedCartData = localStorage.getItem('cartItems');
    if (storedCartData) {
      const parsed = JSON.parse(storedCartData);
      setSelectedItems(parsed.selectedItems || {});
      setProducts(parsed.products || []);
    }
  }, []);

  const updateItemQuantity = (productId, itemIndex, change) => {
    setSelectedItems(prev => {
      const productItems = prev[productId] || {};
      const currentQty = productItems[itemIndex] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      const updatedProduct = { ...productItems };
      if (newQty === 0) {
        delete updatedProduct[itemIndex];
      } else {
        updatedProduct[itemIndex] = newQty;
      }
      
      const updated = { ...prev };
      if (Object.keys(updatedProduct).length === 0) {
        delete updated[productId];
      } else {
        updated[productId] = updatedProduct;
      }
      
      // Update localStorage
      localStorage.setItem('cartItems', JSON.stringify({
        selectedItems: updated,
        products
      }));
      
      return updated;
    });
  };

  const removeProduct = (productId) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[productId];
      
      // Update localStorage
      const filteredProducts = products.filter(p => p._id !== productId);
      localStorage.setItem('cartItems', JSON.stringify({
        selectedItems: updated,
        products: filteredProducts
      }));
      
      return updated;
    });
    
    setProducts(prev => prev.filter(p => p._id !== productId));
  };

  const getCartTotal = () => {
    let total = 0;
    Object.entries(selectedItems).forEach(([productId, items]) => {
      const product = products.find(p => p._id === productId);
      if (product) {
        Object.entries(items).forEach(([itemKey, quantity]) => {
          if (itemKey.startsWith('ind_')) {
            const variationIndex = parseInt(itemKey.split('_')[1]);
            const variation = product.variations[variationIndex];
            if (variation) {
              total += variation.price * quantity;
            }
          } else if (itemKey.startsWith('pkt_')) {
            const packetIndex = parseInt(itemKey.split('_')[1]);
            const packet = product.packets[packetIndex];
            if (packet) {
              total += packet.pricePerPacket * quantity;
            }
          }
        });
      }
    });
    return total;
  };

  const getTotalItems = () => {
    return Object.values(selectedItems).reduce((total, productItems) => 
      total + Object.values(productItems).reduce((sum, qty) => sum + qty, 0), 0
    );
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    
    // Store cart data for checkout
    localStorage.setItem('checkoutItems', JSON.stringify({
      selectedItems,
      products,
      total: getCartTotal()
    }));
    
    router.push('/checkout');
  };

  const cartItemsArray = Object.entries(selectedItems).flatMap(([productId, items]) => {
    const product = products.find(p => p._id === productId);
    if (!product) return [];
    
    return Object.entries(items).map(([itemKey, quantity]) => {
      if (itemKey.startsWith('ind_')) {
        const variationIndex = parseInt(itemKey.split('_')[1]);
        const variation = product.variations[variationIndex];
        return {
          productId,
          product,
          itemKey,
          quantity,
          type: 'individual',
          item: variation,
          totalPrice: variation.price * quantity
        };
      } else if (itemKey.startsWith('pkt_')) {
        const packetIndex = parseInt(itemKey.split('_')[1]);
        const packet = product.packets[packetIndex];
        return {
          productId,
          product,
          itemKey,
          quantity,
          type: 'packet',
          item: packet,
          totalPrice: packet.pricePerPacket * quantity
        };
      }
      return null;
    }).filter(Boolean);
  });

  return (
    <>
      <Head>
        <title>Shopping Cart - BeverageHub</title>
      </Head>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Shopping Cart
          </Typography>
        </Box>

        {cartItemsArray.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Add some beverages to get started!
              </Typography>
              <Button variant="contained" onClick={() => router.push('/')}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cart Items ({getTotalItems()})
                </Typography>
                
                <List>
                  {cartItemsArray.map((cartItem, index) => (
                    <React.Fragment key={`${cartItem.productId}-${cartItem.itemKey}`}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {cartItem.product.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {cartItem.type === 'individual' 
                                  ? `${cartItem.item.size} - KSh ${cartItem.item.price}`
                                  : `${cartItem.item.packetType} (${cartItem.item.unitsPerPacket}×${cartItem.item.size}) - KSh ${cartItem.item.pricePerPacket}`
                                }
                              </Typography>
                              {cartItem.type === 'packet' && (
                                <Typography variant="caption" color="success.main">
                                  Save KSh {cartItem.item.savings} per packet
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateItemQuantity(cartItem.productId, cartItem.itemKey, -1)}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: '20px', textAlign: 'center' }}>
                                  {cartItem.quantity}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateItemQuantity(cartItem.productId, cartItem.itemKey, 1)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Typography variant="body1" fontWeight="bold">
                                KSh {cartItem.totalPrice}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => updateItemQuantity(cartItem.productId, cartItem.itemKey, -cartItem.quantity)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < cartItemsArray.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">
                    Subtotal ({getTotalItems()} items)
                  </Typography>
                  <Typography variant="body1">
                    KSh {getCartTotal()}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">
                    Delivery Fee
                  </Typography>
                  <Typography variant="body1">
                    KSh 100
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6">
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    KSh {getCartTotal() + 100}
                  </Typography>
                </Box>

                {!isAuthenticated && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Please log in to proceed with checkout
                  </Alert>
                )}

                <Box display="flex" gap={2}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={() => router.push('/')}
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleCheckout}
                    disabled={!isAuthenticated}
                  >
                    Proceed to Checkout
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </>
  );
}