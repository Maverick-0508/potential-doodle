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
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
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
          
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={cartItems} color="error">
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
                      component="div"
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography color="text.secondary">
                        {product.name}
                      </Typography>
                    </CardMedia>
                    
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {product.brand}
                      </Typography>
                      
                      {product.variations && product.variations.length > 0 && (
                        <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                          {product.variations.map((variation, index) => (
                            <Chip
                              key={index}
                              label={`${variation.size} - KSh ${variation.price}`}
                              size="small"
                              variant="outlined"
                              clickable
                            />
                          ))}
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="text.secondary">
                        Starting from KSh {product.basePrice || (product.variations?.[0]?.price || 'N/A')}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Typography variant="body2">
                          ⭐ {product.rating || 'New'}
                        </Typography>
                        <Chip label="Add to Cart" color="primary" clickable />
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
    </>
  );
}