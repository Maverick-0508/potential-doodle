import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  TextField, 
  InputAdornment,
  Tabs,
  Tab,
  IconButton,
  Badge,
  Button,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, logout, getAuthHeader, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [purchaseMode, setPurchaseMode] = useState('individual'); // 'individual' or 'packets'
  const [selectedItems, setSelectedItems] = useState({}); // {productId: {variationIndex/packetIndex: quantity}}
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/meta/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`http://localhost:5000/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (productId) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/favorite`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setProducts(products.map(product => 
          product._id === productId 
            ? { ...product, isFavorite: !product.isFavorite }
            : product
        ));
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

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
      
      return updated;
    });
  };

  const getItemQuantity = (productId, itemIndex) => {
    return selectedItems[productId]?.[itemIndex] || 0;
  };

  const getTotalCartItems = () => {
    return Object.values(selectedItems).reduce((total, productItems) => 
      total + Object.values(productItems).reduce((sum, qty) => sum + qty, 0), 0
    );
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

  const handleViewCart = () => {
    // Store cart data in localStorage or context for the cart page
    localStorage.setItem('cartItems', JSON.stringify({
      selectedItems,
      products: products.filter(p => selectedItems[p._id])
    }));
    router.push('/cart');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Head>
        <title>BeverageHub - Fresh Drinks Delivered</title>
      </Head>
      
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BeverageHub
          </Typography>
          
          <IconButton 
            color="inherit" 
            sx={{ mr: 2 }} 
            onClick={handleViewCart}
            disabled={getTotalCartItems() === 0}
          >
            <Badge badgeContent={getTotalCartItems()} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>

          {isAuthenticated ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleMenuClick}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { router.push('/orders'); handleMenuClose(); }}>
                  My Orders
                </MenuItem>
                <MenuItem onClick={() => { router.push('/wallet'); handleMenuClose(); }}>
                  My Wallet
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={() => router.push('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isAuthenticated && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Welcome back, {user?.name}!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search for drinks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Category Tabs */}
        {categories.length > 0 && (
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            {categories.map((category) => (
              <Tab
                key={category.id}
                label={`${category.name} (${category.count})`}
                value={category.id}
              />
            ))}
          </Tabs>
        )}

        {/* Purchase Mode Toggle */}
        <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={purchaseMode}
            exclusive
            onChange={(e, newMode) => newMode && setPurchaseMode(newMode)}
            aria-label="purchase mode"
            size="small"
          >
            <ToggleButton value="individual" aria-label="individual purchases">
              Individual Items
            </ToggleButton>
            <ToggleButton value="packets" aria-label="packet purchases">
              Bulk Packets
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Products Grid */}
        {!loading && (
          <Grid container spacing={2}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <Card sx={{ height: '100%', position: 'relative' }}>
                    <IconButton
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                      color={product.isFavorite ? 'error' : 'default'}
                      onClick={() => handleFavorite(product._id)}
                    >
                      <FavoriteIcon />
                    </IconButton>
                    
                    <CardMedia
                      component="img"
                      height="200"
                      image={`/images/products/${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.svg`}
                      alt={product.name}
                      sx={{
                        objectFit: 'contain',
                        bgcolor: 'grey.50',
                        p: 1
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">
                        {product.name}
                      </Typography>
                    </Box>
                    
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {product.brand}
                      </Typography>
                      
                      {/* Individual Mode */}
                      {purchaseMode === 'individual' && product.variations && product.variations.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Select Size:
                          </Typography>
                          {product.variations.map((variation, index) => (
                            <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Chip
                                label={`${variation.size} - KSh ${variation.price}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                              <Box display="flex" alignItems="center" gap={1}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateItemQuantity(product._id, `ind_${index}`, -1)}
                                  disabled={getItemQuantity(product._id, `ind_${index}`) === 0}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: '20px', textAlign: 'center' }}>
                                  {getItemQuantity(product._id, `ind_${index}`)}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateItemQuantity(product._id, `ind_${index}`, 1)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Packet Mode */}
                      {purchaseMode === 'packets' && product.packets && product.packets.length > 0 && (
                        <Box mb={2}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Select Packet:
                          </Typography>
                          {product.packets.map((packet, index) => (
                            <Box key={index} mb={1}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Chip
                                    label={`${packet.packetType} (${packet.unitsPerPacket}×${packet.size})`}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                  <Typography variant="caption" display="block" color="success.main">
                                    KSh {packet.pricePerPacket} (Save KSh {packet.savings})
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => updateItemQuantity(product._id, `pkt_${index}`, -1)}
                                    disabled={getItemQuantity(product._id, `pkt_${index}`) === 0}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="body2" sx={{ minWidth: '20px', textAlign: 'center' }}>
                                    {getItemQuantity(product._id, `pkt_${index}`)}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => updateItemQuantity(product._id, `pkt_${index}`, 1)}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* No options message */}
                      {purchaseMode === 'packets' && (!product.packets || product.packets.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                          Packet options not available for this product
                        </Typography>
                      )}
                      
                      {/* Pricing Display */}
                      {purchaseMode === 'individual' && (
                        <Typography variant="body2" color="text.secondary">
                          Starting from KSh {product.basePrice || (product.variations?.[0]?.price || 'N/A')}
                        </Typography>
                      )}
                      
                      {purchaseMode === 'packets' && product.packets && product.packets.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Packet from KSh {Math.min(...product.packets.map(p => p.pricePerPacket))}
                          </Typography>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                            Save up to KSh {Math.max(...product.packets.map(p => p.savings))}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Typography variant="body2">
                          ⭐ {product.rating || 'New'}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          {Object.values(selectedItems[product._id] || {}).reduce((sum, qty) => sum + qty, 0)} in cart
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary">
                    No products found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or category filter
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* Floating Cart Summary */}
      {getTotalCartItems() > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: 3,
            zIndex: 1000
          }}
        >
          <Typography variant="h6" gutterBottom>
            Cart Summary
          </Typography>
          <Typography variant="body2">
            {getTotalCartItems()} items - KSh {getCartTotal()}
          </Typography>
          <Button 
            fullWidth 
            variant="contained" 
            color="secondary" 
            sx={{ mt: 1 }}
            onClick={handleViewCart}
          >
            View Cart
          </Button>
        </Box>
      )}
    </>
  );
}