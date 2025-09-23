# Beverage E-Commerce Application

## Project Overview
Full-stack beverage e-commerce application with Uber Eats-style frontend and production-ready backend.

## Features Implemented
- User authentication and registration
- Uber Eats-style product catalog with categories
- Product variations (sizes, prices)
- Favorite orders management
- In-app wallet with M-Pesa integration
- Order management and tracking
- Mobile-responsive design

## Tech Stack
- Frontend: Next.js 15, React, Material-UI
- Backend: Node.js, Express, MongoDB
- Authentication: JWT
- Payments: M-Pesa STK Push

## Development Setup
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Use VS Code task "Start Full Stack" to launch both servers

## Key Files
- `/frontend/pages/` - Main application pages
- `/backend/src/routes/` - API endpoints
- `/backend/src/models/` - Database schemas
- `/backend/src/services/mpesaService.js` - Payment integration

## Environment Configuration Required
Configure M-Pesa credentials in `backend/.env` for payment functionality.

## Project Status: ✅ COMPLETE
All requested features have been implemented and tested. The application is ready for development and can be extended with additional features as needed.
