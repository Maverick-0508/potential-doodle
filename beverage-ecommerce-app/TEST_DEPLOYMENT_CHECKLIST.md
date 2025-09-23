# Testing and Deployment Checklist for Beverage E-Commerce App

## 1. Environment Variables
- [ ] Copy `.env.prod.example` to `.env.prod` in the `deploy/` directory
- [ ] Fill in all required secrets and values in `.env.prod`
- [ ] Double-check all URLs, secrets, and credentials for accuracy
- [ ] Ensure SSL certificates are present in `deploy/ssl` (for Nginx)

## 2. Backend
- [ ] Install dependencies: `npm install` in `backend/`
- [ ] Ensure `start` and `dev` scripts work as expected
- [ ] (Recommended) Add and run automated tests
- [ ] Confirm MongoDB and Redis connection strings are correct

## 3. Frontend
- [ ] Install dependencies: `npm install` in `frontend/`
- [ ] Build the app: `npm run build` in `frontend/`
- [ ] Ensure `start` and `dev` scripts work as expected
- [ ] (Recommended) Add and run automated tests
- [ ] Confirm API URLs are correct in environment variables

## 4. Docker & Deployment
- [ ] Build Docker images for backend and frontend
- [ ] Push images to GitHub Container Registry as referenced in `docker-compose.prod.yml`
- [ ] Ensure `docker-compose.prod.yml` is up to date and references correct image tags
- [ ] Run `deploy.sh` and monitor logs for errors
- [ ] Confirm all services (frontend, backend, MongoDB, Redis, Nginx) start successfully

## 5. Post-Deployment
- [ ] Access frontend via browser and verify UI loads
- [ ] Test all major user flows (auth, product browsing, cart, checkout, wallet, orders)
- [ ] Check backend API endpoints (auth, products, orders, wallet)
- [ ] Verify payment integration (M-Pesa) in production
- [ ] Monitor logs for errors or warnings
- [ ] Confirm HTTPS is enforced and SSL is working

---

**Note:**
- Automated tests and CI/CD are highly recommended for production readiness.
- Always keep secrets and credentials secure.
