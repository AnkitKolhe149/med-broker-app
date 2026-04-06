# Development Guide - MedIQ Platform

Complete guide for setting up, developing, and testing the MedIQ medicine marketplace platform.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Authentication System](#authentication-system)
3. [Database Seeding](#database-seeding)
4. [API Testing](#api-testing)
5. [Development Workflow](#development-workflow)

---

## Project Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL (Neon account recommended)
- Python 3.8+ (for AI/ML services)
- Git

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd medicine-marketplace-platform

# 2. Install backend dependencies
cd backend
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL, JWT_SECRET, and other credentials

# 4. Run database migrations
npm run prisma:migrate

# 5. Seed database with test data
npm run seed

# 6. Start backend server
npm run dev

# 7. In another terminal, install frontend dependencies
cd ../frontend
npm install

# 8. Start frontend development server
npm run dev
```

### Environment Setup

Create `.env` in backend directory:
```
DATABASE_URL=postgresql://user:password@neon.tech/mediq
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
NODE_ENV=development
PAYMENT_GATEWAY_KEY=your-payment-key
AZURE_STORAGE_CONNECTION=your-storage-key
```

---

## Authentication System

### Role-Based Architecture

MedIQ supports three user roles with distinct workflows:

#### **1. Customer Role**
- **Sign Up**: Email, password, name, phone
- **Onboarding**:
  - Full Name & Contact details
  - Buyer Type selection (Retail/Wholesale)
  - Conditional Business Name field (for Wholesale)
  - Optional GSTIN (for Wholesale buyers)
  - Country & City
  - Delivery Address
- **Capabilities**:
  - Browse medicine catalog
  - Place orders
  - Track shipments
  - View order history
  - Manage profile

#### **2. Vendor Role**
- **Sign Up**: Business email, password, name
- **Onboarding**:
  - Business/Company Name
  - Vendor Type (Manufacturer, Distributor, Pharmacy)
  - Country & State selection
  - GSTIN Number validation (15 characters)
  - Drug License Number
  - Business Address
  - Contact Person details
- **Verification**:
  - Admin reviews GSTIN and Drug License
  - Verification status: PENDING → VERIFIED or REJECTED
  - Only verified vendors can list medicines
- **Capabilities**:
  - Manage inventory
  - View orders
  - Analytics dashboard
  - Bulk upload medicines

#### **3. Admin Role**
- **Sign Up**: Direct database entry
- **Capabilities**:
  - Vendor verification & approval
  - User management
  - Platform analytics
  - Dispute resolution

### Authentication Flow

```
Frontend │ Backend │ Database
   │       │          │
   │──Register──→│     │
   │             │──Create User──→│
   │             │←──User ID───────│
   │←─JWT Token──│     │
   │             │     │
   │──Login──────→│     │
   │             │──Verify Password──→│
   │             │←──User Data────────│
   │             │──Generate JWT──→   │
   │←─JWT Token──│     │
   │             │     │
   │──Request────→│     │
   │(JWT)         │──Verify Token──→  │
   │             │←──Valid/Invalid─── │
   │←─Response───│     │
```

### Backend APIs - Authentication

#### Register User
**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

Response (201 Created):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200 OK):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "isProfileComplete": true
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Refresh Token
**POST** `/api/auth/refresh`

Response: New JWT token valid for 7 days

---

## Database Seeding

### Purpose
Populate development database with realistic test data for local development and testing.

### What Gets Created

**Users (5 total):**
- 1 Admin user
- 3 Verified Vendor users (Pharmacy type)
- 1 Customer user

**Test Credentials:**
```
Admin User:
  Email: admin@mediq.com
  Password: admin123

Vendors:
  Email: vendor1@mediq.com
  Email: vendor2@mediq.com
  Email: vendor3@mediq.com
  Password: vendor123 (all vendors)
  Status: VERIFIED

Customer:
  Email: customer@mediq.com
  Password: customer123
```

**Medicines:**
- 20 realistic medicines with:
  - Name, composition, strength
  - Manufacturer information
  - Pricing in Indian Rupees (₹)
  - Prescription requirements
  - Category classification

**Inventory:**
- 30+ inventory entries
- Random stock levels (50-450 units)
- Each medicine assigned to 1-2 vendors
- Reorder levels configured

### Running Seed

```bash
cd backend

# Run the seed script
npm run seed
```

### ⚠️ Important Warnings

1. **Data Loss**: Running seed **deletes all existing data** and starts fresh
2. **Development Only**: Never run seed on production database
3. **One-Time**: Usually run once when setting up local development
4. **Resetable**: Can re-run anytime to reset database to clean state
5. **Disable**: Set `SEED_ENABLED="false"` in `.env` to skip seeding

### After Seeding

Once seeded, you can immediately:
- **Login as customer**: Browse catalog and place test orders
- **Login as vendor**: Manage inventory and view orders
- **Login as admin**: Approve vendors and view analytics

The frontend automatically fetches medicines from the database via API.

---

## API Testing

### Using Postman/REST Client

1. **Set Authorization Headers**:
   ```
   Authorization: Bearer <jwt_token_from_login>
   Content-Type: application/json
   ```

2. **Test Endpoints**:
   ```
   GET /api/medicines          - List all medicines
   POST /api/orders            - Create order
   GET /api/orders/:id         - Get order details
   GET /api/vendor/inventory   - View vendor inventory
   POST /api/vendor/medicines  - Add new medicine
   ```

### Frontend API Integration

The frontend uses Axios for API calls with automatic token injection:

```javascript
// services/auth.service.js
export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('authToken', response.data.token);
  return response.data;
}

// services/medicines.service.js
export async function getMedicines(page = 1, limit = 12) {
  return api.get('/medicines', { params: { page, limit } });
}
```

---

## Development Workflow

### Frontend Development

```bash
cd frontend

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Frontend Stack:**
- React 18.2.0 with Vite 6.4.1
- Context API for state management
- React Router 6.22.3 for navigation
- Responsive CSS with mobile-first approach

### Backend Development

```bash
cd backend

# Start server with auto-reload
npm run dev

# Run TypeScript compiler check
npm run type-check

# Format code
npm run format
```

**Backend Stack:**
- Express.js 4.18.2
- Prisma ORM for database
- JWT authentication
- Role-based middleware

### Database Commands

```bash
# View Prisma Studio (GUI for database)
npm run prisma:studio

# Create new migration
npm run prisma:migrate-dev

# Reset database (careful!)
npm run prisma:reset
```

### AI/ML Services

```bash
cd ai-ml

# Install Python dependencies
pip install -r requirements.txt

# Start chatbot API
python apis/chatbot_api.py

# Start disease prediction API
python apis/disease_api.py

# Start recommendation API
python apis/recommendation_api.py
```

---

## Common Development Tasks

### Adding a New Medicine Field

1. **Update Database Schema** (prisma/schema.prisma):
   ```prisma
   model Medicine {
     id String @id @default(cuid())
     name String
     # Add new field
     newField String?
   }
   ```

2. **Create Migration**:
   ```bash
   npm run prisma:migrate-dev --name "add_new_field"
   ```

3. **Update Backend API** (backend/src/modules/medicines):
   - Update controller
   - Update service
   - Update routes if needed

4. **Update Frontend** (frontend/src/services/medicines.service.js):
   - Add field to API calls
   - Update component to display field

5. **Update Tests**:
   - Add test cases for new field

### Debugging

**Backend:**
```bash
# Run with debug logs
NODE_DEBUG=* npm run dev

# Use VS Code debugger - set breakpoints and F5
```

**Frontend:**
```bash
# Open browser DevTools (F12)
# Use React DevTools extension
# Use Vite debug mode
```

**Database:**
```bash
# Open Prisma Studio
npm run prisma:studio

# View raw queries in logs
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection failed | Check DATABASE_URL in .env, verify PostgreSQL is running |
| Seed script fails | Delete existing database, run migrations again, then seed |
| JWT errors | Verify JWT_SECRET matches between .env and code |
| Frontend can't reach API | Check CORS settings in backend app.js |
| Module not found errors | Run `npm install` in both backend and frontend |

---

## Next Steps

- Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for all endpoints
- Explore [FEATURES_AND_ROADMAP.md](./FEATURES_AND_ROADMAP.md) for planned improvements
