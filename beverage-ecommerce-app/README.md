# Beverage E-Commerce App

This project is a full-stack e-commerce application specializing in the sale of beverages (water, soda, energy drinks, and more) with a modern, Uber Eats-style frontend and a production-ready backend.

## Features
- 🔐 User authentication (login/registration)
- 🛒 Uber Eats-style layout for browsing beverages
- ❤️ Favorite orders management
- 💰 In-app wallet with M-Pesa integration
- 📦 Orders section with tracking
- 🔍 Easy product browsing with categories and variations
- 🏭 Production-ready backend (user, product, order, wallet management)
- 📱 Mobile-responsive design

## Tech Stack
- **Frontend**: Next.js 15, React, Material-UI
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT
- **Payments**: M-Pesa STK Push integration
- **Development**: VS Code tasks for easy startup

## Project Structure
```
beverage_e-commerce app/
├── frontend/           # Next.js React frontend
│   ├── pages/         # Page components
│   │   ├── index.js   # Home page with product catalog
│   │   ├── login.js   # User authentication
│   │   ├── orders.js  # Order history and favorites
│   │   ├── wallet.js  # Wallet management
│   │   └── checkout.js # Payment processing
│   └── components/    # Reusable components
├── backend/           # Node.js Express backend
│   ├── src/
│   │   ├── models/    # Database models (User, Product, Order)
│   │   ├── routes/    # API routes (auth, products, orders, wallet)
│   │   ├── services/  # M-Pesa service integration
│   │   └── middleware/# Authentication middleware
│   └── .env.example   # Environment variables template
└── .vscode/tasks.json # VS Code development tasks
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- M-Pesa Developer Account (for payments)

### Installation & Setup

1. **Clone and navigate to the project**
   ```bash
   cd "beverage_e-commerce app"
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd ../frontend && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your configurations:
   # - MongoDB connection string
   # - JWT secret key
   # - M-Pesa credentials (consumer key, secret, shortcode, passkey)
   ```

4. **Start Development Servers**
   
   **Option A: Using VS Code Tasks (Recommended)**
   - Open VS Code
   - Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Full Stack"
   
   **Option B: Manual Start**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get products (with filtering)
- `GET /api/products/:id` - Get product details
- `GET /api/products/meta/categories` - Get categories
- `POST /api/products/:id/favorite` - Add to favorites

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/mpesa/callback` - M-Pesa payment callback

### Wallet
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/topup` - Top up wallet with M-Pesa
- `GET /api/wallet/transactions` - Get transaction history

## Development Features

### VS Code Tasks Available
- **Start Backend Server**: Runs backend in development mode
- **Start Frontend Server**: Runs frontend in development mode  
- **Start Full Stack**: Launches both servers simultaneously

### M-Pesa Integration
The application includes complete M-Pesa STK Push integration for:
- Wallet top-ups
- Order payments
- Transaction tracking
- Callback handling

Configure your M-Pesa credentials in `backend/.env`:
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api
MPESA_ENVIRONMENT=sandbox  # or 'production'
```

## Deployment
The application is ready for production deployment with:
- Environment-based configuration
- Production-ready error handling
- Scalable database design
- Secure authentication

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.
