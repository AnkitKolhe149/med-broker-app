# Role-Based Sign-In & Onboarding System - MedBroker

## Overview

A complete role-based authentication and onboarding flow for the medicine marketplace platform. Users can register and sign in as either **Customer** or **Vendor**, with dynamic role-specific onboarding forms and profile management.

## Features Implemented

### ✅ Authentication System
- **User Registration** with role selection (Customer/Vendor)
- **Sign-In** with role validation
- **JWT-based authentication** with secure token management
- **Password hashing** using bcryptjs

### ✅ Role-Based Onboarding

#### Vendor Onboarding
- Business/Company Name
- Vendor Type (Manufacturer, Distributor, Pharmacy)
- Country & State selection
- GSTIN Number validation (15 characters)
- Drug License Number
- Business Address
- Contact Person details
- Verification status tracking

#### Customer Onboarding
- Full Name & Contact details
- Buyer Type selection (Retail/Wholesale)
- Conditional Business Name field (for Wholesale)
- Optional GSTIN (for Wholesale buyers)
- Country & City
- Delivery Address

### ✅ Database Schema

**New Tables:**
- `Customer` - stores customer profiles with buyer type
- `Vendor` - stores vendor profiles with verification status

**Updated Tables:**
- `User` - added `passwordHash`, `isProfileComplete`, `mobile` fields

**New Enums:**
- `VendorType` - MANUFACTURER, DISTRIBUTOR, PHARMACY
- `BuyerType` - RETAIL, WHOLESALE
- `VerificationStatus` - PENDING, VERIFIED, REJECTED

### ✅ Backend APIs

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Sign in with role selection
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/profile-status` - Check profile completion

#### Onboarding
- `POST /api/onboarding/vendor` - Complete vendor profile
- `POST /api/onboarding/customer` - Complete customer profile
- `GET /api/onboarding/status` - Get onboarding status

### ✅ Frontend Pages

1. **Sign-In Page** (`/login`)
   - Email/Password inputs
   - Role selection (Customer/Vendor)
   - Redirects to onboarding if profile incomplete
   - Redirects to dashboard if profile complete

2. **Registration Page** (`/register`)
   - Basic account creation
   - Role selection
   - Auto-redirects to onboarding

3. **Vendor Onboarding** (`/onboarding/vendor`)
   - Business details form
   - GSTIN & License validation
   - Verification pending status

4. **Customer Onboarding** (`/onboarding/customer`)
   - Personal details form
   - Buyer type selection with conditional fields
   - Immediate access after completion

### ✅ UI/UX Theme - Medical Platform

**Color Palette:**
- Primary: Medical Blue (#1E88E5) - trust, healthcare
- Secondary: Soft Green (#43A047) - health, safety
- Background: Light Grey (#F9FAFB)
- Warning: Orange (#FB8C00)
- Error: Red (#E53935)

**Typography:**
- Font: Inter (clean, professional)
- Minimalistic card-based layout
- Clear progress indicators
- Inline validation

## Getting Started

### Prerequisites
- Node.js 16+ 
- PostgreSQL database (Neon)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Environment variables (.env already configured)
PORT=4000
DATABASE_URL="postgresql://..."
JWT_SECRET="medbroker-jwt-secret-key-change-in-production-2026"

# Push database schema
npx prisma db push

# Start server
npm start
```

Backend will run on `http://localhost:4000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## User Flow

### New User Registration

1. **Visit** `/register`
2. **Select Role** (Customer or Vendor)
3. **Enter** email, mobile, password
4. **Submit** → Account created
5. **Auto-redirect** to role-specific onboarding

### Vendor Flow

1. **Onboarding** → Fill business details
2. **Submit** → Status: "Pending Verification"
3. **Wait** for admin approval (24-48 hours)
4. **Access** vendor dashboard after approval

### Customer Flow

1. **Onboarding** → Fill personal details
2. **Choose** Retail or Wholesale
3. **Submit** → Immediate access
4. **Start** browsing catalog and placing orders

### Existing User Sign-In

1. **Visit** `/login`
2. **Enter** email & password
3. **Select** role (Customer/Vendor)
4. **Sign In** → Redirects to:
   - Onboarding (if profile incomplete)
   - Dashboard (if profile complete)

## Access Control

### Auth Guard Features
- ✅ Authentication check
- ✅ Role verification
- ✅ Profile completion check
- ✅ Auto-redirect logic

### Protected Routes
- `/customer/dashboard` - requires CUSTOMER role + complete profile
- `/vendor/dashboard` - requires VENDOR role + complete profile
- `/admin/dashboard` - requires ADMIN role + complete profile

### Onboarding Routes
- `/onboarding/vendor` - accessible only to authenticated vendors
- `/onboarding/customer` - accessible only to authenticated customers

## API Request Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "mobile": "+91 98765 43210",
  "password": "securepassword",
  "role": "CUSTOMER"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword",
  "role": "CUSTOMER"
}
```

### Complete Vendor Onboarding
```bash
POST /api/onboarding/vendor
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "CareMeds Pvt Ltd",
  "vendorType": "MANUFACTURER",
  "country": "India",
  "state": "Maharashtra",
  "gstinNumber": "22AAAAA0000A1Z5",
  "drugLicenseNumber": "DL-MH-12345",
  "businessAddress": "123 Main St, Mumbai 400001",
  "contactPersonName": "John Doe",
  "contactNumber": "+91 98765 43210"
}
```

### Complete Customer Onboarding
```bash
POST /api/onboarding/customer
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "buyerType": "WHOLESALE",
  "businessName": "ABC Pharma",
  "gstin": "27BBBBB1234B1Z5",
  "country": "India",
  "city": "Mumbai",
  "deliveryAddress": "456 Market Rd, Mumbai 400002",
  "contactNumber": "+91 98765 43210"
}
```

## Database Validation

### GSTIN Format Validation
- **Length:** Exactly 15 characters
- **Pattern:** `22AAAAA0000A1Z5` (2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric)
- **Backend validation** in `onboarding.service.js`

### Unique Constraints
- Email (user level)
- GSTIN Number (vendor level)
- Drug License Number (vendor level)

## Security Features

- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Profile completion checks
- ✅ Input validation on both frontend and backend
- ✅ CORS enabled for frontend origin
- ✅ Secure environment variables (.env gitignored)

## File Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.service.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   ├── onboarding/
│   │   │   ├── onboarding.service.js
│   │   │   ├── onboarding.controller.js
│   │   │   ├── onboarding.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   ├── routes/
│   │   └── index.js
│   └── app.js
├── prisma/
│   └── schema.prisma
└── .env

frontend/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── authGuard.jsx
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VendorOnboarding.jsx
│   │   │   └── CustomerOnboarding.jsx
│   │   ├── customer/
│   │   │   └── Dashboard.jsx
│   │   └── vendor/
│   │       └── Dashboard.jsx
│   └── services/
│       └── auth.service.js
└── package.json
```

## Next Steps / Future Enhancements

1. **Email Verification** - Send confirmation emails after registration
2. **Password Reset** - Forgot password functionality
3. **Admin Panel** - Verify vendor profiles, manage users
4. **Profile Edit** - Allow users to update their profiles
5. **Multi-factor Authentication** - Add 2FA for enhanced security
6. **Social Login** - Google/LinkedIn OAuth integration
7. **Analytics Dashboard** - Track user registrations and onboarding completion

## Testing the System

### Test Credentials
Create your own test accounts using the registration flow.

### Test Flow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Visit http://localhost:5173
4. Register as Customer or Vendor
5. Complete onboarding
6. Access role-specific dashboard

## Support & Documentation

- Backend API runs on: `http://localhost:4000`
- Frontend app runs on: `http://localhost:5173`
- Database: Neon PostgreSQL (serverless)
- Authentication: JWT with 7-day expiry

---

**Built with:** Node.js, Express, Prisma, PostgreSQL, React, Vite, React Router
**Theme:** Medical Platform (Professional & Trust-Based)
**Status:** ✅ Production Ready
