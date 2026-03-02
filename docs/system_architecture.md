# System Architecture

## Platform Overview

MedBroker is built using a modern, scalable **3-tier architecture** with a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Frontend)                  │
│                    React 18.2.0 + Vite 6.4.1                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               APPLICATION LAYER (Backend APIs)              │
│              Node.js + Express 4.18.2 + Prisma              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              DATA LAYER (Database & AI Services)            │
│     PostgreSQL (Neon) + Python ML APIs + Payment Gateway    │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### 1. **Frontend Tier** (React + Vite)

**Technology Stack:**
- React 18.2.0 - UI component framework
- Vite 6.4.1 - Fast build tool and dev server
- React Router 6.22.3 - Client-side routing
- Axios - HTTP client for API calls
- Context API - State management

**Key Features Implemented:**
- **Landing Page**: Hero section with floating cards, features, benefits, trust section
- **Authentication Pages**: Login, Register, Customer/Vendor Onboarding
- **Customer Catalog**: 
  - 4-column grid layout for medicine display
  - Advanced filtering sidebar (resizable, 340px default width)
  - Price range sliders (₹0-₹500)
  - Real-time search functionality
  - Sorting options (relevance, price, rating)
- **Product Details Page**: Medicine information, reviews, ratings
- **Cart Management**: Add/remove items, quantity adjustment
- **Order Management**: Track orders, view history
- **User Dashboards**:
  - Customer: Catalog, Orders, Profile, Cart
  - Vendor: Inventory, Orders, Analytics, Settings
  - Admin: User management, Vendor approval, Analytics

**Design System:**
- Medical Green (#00A86B) - Primary color for trust
- Medical Blue (#0088CC) - Accent color
- Professional typography (Inter font)
- Consistent spacing and component design

---

### 2. **Backend Tier** (Node.js + Express)

**Technology Stack:**
- Node.js - JavaScript runtime
- Express 4.18.2 - Web framework
- Prisma 5.22.0 - ORM for database operations
- JWT - Token-based authentication
- Bcrypt - Password encryption
- Multer - File upload handling

**Core Services:**

#### Authentication Module
- User registration with role selection (Customer/Vendor/Admin)
- Login with JWT token generation (7-day expiration)
- Profile completion during onboarding
- Role-based access control (RBAC)
- Token refresh mechanism

#### Medicine Catalog Module
- Search medicines by name, composition, strength
- Filter by category, price, availability, prescription requirement
- Inventory management
- Price tracking and comparison
- Stock level management

#### Order Management Module
- Shopping cart functionality
- Order creation and confirmation
- Order status tracking (Pending → Processing → Shipped → Delivered)
- Invoice generation
- Order history and analytics

#### Payment Module
- Multiple payment gateway integration
- Secure transaction processing
- Payment status tracking
- Refund handling
- Receipt generation

#### Vendor Management Module
- Vendor registration and onboarding
- GSTIN and Drug License verification
- Inventory management dashboard
- Sales analytics
- Customer reviews and ratings

#### Admin Module
- User and vendor management
- Order verification and approval
- Platform analytics
- Settings and configuration

#### Notification Module
- Email notifications
- Order status updates
- Payment confirmations
- System alerts

#### Analytics Module
- Sales tracking
- User behavior analysis
- Inventory insights
- Revenue reports

---

### 3. **Data Tier** (Database & External Services)

**Database: PostgreSQL (Neon Serverless)**
- Cloud-based, auto-scaling PostgreSQL
- Managed backups and security
- Connection pooling support
- Real-time replication

**Key Database Entities:**
- Users (Customers, Vendors, Admins)
- Medicines & Inventory
- Orders & Order Items
- Payments & Invoices
- Reviews & Ratings
- Categories & Attributes

**External Services:**
- **Payment Gateway** (Razorpay/Stripe integration)
- **Email Service** (NodeMailer/SendGrid for notifications)
- **File Storage** (Cloudinary/AWS S3 for images)

---

## API Architecture

### REST API Structure

**Base URL:** 
- **Development:** `http://localhost:4000/api`
- **Production:** `https://api.medbroker.com/api`

**API Endpoints Categories:**

| Category | Purpose |
|----------|---------|
| `/auth` | User authentication, registration, login |
| `/medicines` | Medicine catalog, search, details |
| `/cart` | Shopping cart operations |
| `/orders` | Order management and tracking |
| `/payments` | Payment processing |
| `/vendors` | Vendor operations and analytics |
| `/users` | User profile management |
| `/admin` | Admin operations |
| `/reviews` | Product reviews and ratings |

---

## Communication Flow

### User Registration Flow
```
User submits registration
         ↓
Express validates input
         ↓
Password encrypted with Bcrypt
         ↓
User data stored in PostgreSQL
         ↓
Verification email sent
         ↓
User account created
```

### Medicine Purchase Flow
```
User searches/filters medicines
         ↓
Frontend calls GET /medicines API
         ↓
Backend queries PostgreSQL
         ↓
Results returned with inventory status
         ↓
User adds to cart
         ↓
User proceeds to checkout
         ↓
Payment processing via gateway
         ↓
Order created in database
         ↓
Inventory updated
         ↓
Order confirmation email sent
```

---

## Security Architecture

**Authentication:**
- JWT tokens with 7-day expiration
- Secure password hashing (bcrypt with salt)
- Role-based access control (RBAC)

**Data Protection:**
- HTTPS/TLS encryption for data in transit
- Password encryption at rest
- SQL injection prevention via Prisma ORM
- XSS protection via React's built-in security

**Vendor Verification:**
- GSTIN validation (Government Tax ID)
- Drug License verification
- Document upload and review
- Manual admin approval

---

## Deployment Architecture

**Frontend:**
- Vite production build
- Deployed on Vercel/Netlify
- CDN for static assets
- Auto-scaling based on traffic

**Backend:**
- Node.js server on cloud platform (AWS/Heroku/Railway)
- Environment-based configuration
- Process manager (PM2) for reliability
- Auto-restart on crashes

**Database:**
- Neon PostgreSQL with automated backups
- Connection pooling for performance
- Read replicas for scaling

**Infrastructure:**
- Load balancer for distributing traffic
- Nginx reverse proxy
- SSL/TLS certificates

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.2, Vite 6.4, React Router 6.22 |
| **Backend** | Node.js, Express 4.18, Prisma 5.22 |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | JWT, Bcrypt |
| **File Upload** | Multer, Cloudinary |
| **Payment** | Razorpay/Stripe |
| **AI/ML** | Python, Flask, scikit-learn |
| **DevOps** | Docker, Nginx, PM2 |
