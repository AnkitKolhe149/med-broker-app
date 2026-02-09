# MedBroker - Medicine Marketplace Platform

A comprehensive B2B/B2C medicine marketplace platform with role-based access control, AI-powered features, and multi-vendor support.

## 🚀 Features

### Authentication & Authorization
- **Role-Based Access**: Separate workflows for Customers, Vendors, and Admins
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Profile Management**: Complete onboarding flow for vendors and customers
- **Verification System**: Vendor verification workflow for quality assurance

### User Roles

#### 👤 Customer
- **Retail Buyers**: Individual consumers purchasing medicines
- **Wholesale Buyers**: Business entities with GSTIN registration
- Browse medicine catalog with real-time pricing
- Order tracking and invoice generation

#### 🏢 Vendor
- **Types**: Pharmacy, Distributor, Manufacturer, Wholesaler
- Business profile with GSTIN and Drug License verification
- Inventory management
- Order fulfillment system

#### 👨‍💼 Admin
- Vendor verification and approval
- Platform analytics and reporting
- User management

### Technical Features
- Multi-currency support with exchange rates
- QR code generation for invoices
- Real-time inventory tracking
- Payment integration ready
- AI/ML recommendation engine
- Chatbot for customer support
- Disease prediction API

## 🏗️ Architecture

```
medicine-marketplace-platform/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── ai-ml/             # Python AI/ML services
├── infrastructure/    # Docker & deployment configs
└── docs/              # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 6.4.1
- **Routing**: React Router 6.22.3
- **HTTP Client**: Axios 1.6.7
- **Styling**: Custom CSS with Medical Blue theme

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma 5.22.0
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Password Hashing**: bcrypt 3.0.3

### AI/ML
- **Language**: Python
- **Features**: Chatbot, Disease Prediction, Recommendations

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Neon account)
- Python 3.8+ (for AI/ML services)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
PORT=4000
JWT_SECRET="your-super-secret-jwt-key"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000` (or `http://localhost:5173` with Vite)

### AI/ML Setup

1. Navigate to AI/ML directory:
```bash
cd ai-ml
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## 🎯 Usage Guide

### For Customers

1. **Registration**:
   - Visit `http://localhost:3000/register`
   - Choose "Customer" role
   - Provide email, mobile, and password
   - Click "Create Account"

2. **Onboarding**:
   - Fill in full name and address details
   - Select buyer type:
     - **Retail**: For individual purchases
     - **Wholesale**: For business purchases (requires GSTIN)
   - Complete profile

3. **Dashboard Access**:
   - Browse medicine catalog
   - Place orders
   - Track deliveries
   - View invoices

### For Vendors

1. **Registration**:
   - Visit `http://localhost:3000/register`
   - Choose "Vendor" role
   - Provide email, mobile, and password
   - Click "Create Account"

2. **Onboarding**:
   - Enter company name and business details
   - Select vendor type (Pharmacy/Distributor/Manufacturer/Wholesaler)
   - Provide GSTIN (15 characters)
   - Enter Drug License Number
   - Complete address and contact information
   - Submit for verification

3. **After Verification**:
   - Manage inventory
   - Process orders
   - Generate invoices
   - Track sales

### For Admins

1. **Login**:
   - Use admin credentials
   - Access admin dashboard

2. **Vendor Verification**:
   - Review vendor applications
   - Verify GSTIN and Drug License
   - Approve or reject vendors

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile-status` - Check profile completion

### Onboarding
- `POST /api/onboarding/vendor` - Complete vendor onboarding
- `POST /api/onboarding/customer` - Complete customer onboarding
- `GET /api/onboarding/status` - Get onboarding status

## 🎨 Design System

### Color Palette
- **Primary**: #1E88E5 (Medical Blue)
- **Secondary**: #43A047 (Soft Green)
- **Success**: #4CAF50
- **Warning**: #FFC107
- **Error**: #F44336
- **Text**: #2C3E50
- **Background**: #F5F7FA

### Typography
- **Font Family**: Inter, system-ui
- **Base Size**: 16px
- **Line Height**: 1.6

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 7-day expiration
- CORS protection with whitelisted origins
- Input validation and sanitization
- Custom error handling with secure error messages
- Role-based access control (RBAC)

## 📚 Database Schema

### Core Models
- **User**: Authentication and role management
- **Vendor**: Business profiles and verification
- **Customer**: Buyer profiles and preferences
- **Medicine**: Product catalog
- **Inventory**: Stock management
- **Order**: Purchase orders
- **Payment**: Transaction records
- **Invoice**: Billing documents

### Enums
- **UserRole**: CUSTOMER, VENDOR, ADMIN
- **VendorType**: PHARMACY, DISTRIBUTOR, MANUFACTURER, WHOLESALER
- **BuyerType**: RETAIL, WHOLESALE
- **VerificationStatus**: PENDING, VERIFIED, REJECTED

## 🚦 Error Handling

Custom error classes for consistent API responses:
- `ValidationError` (400): Invalid input data
- `AuthenticationError` (401): Invalid credentials
- `ForbiddenError` (403): Insufficient permissions
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Duplicate resource

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Configure Nginx reverse proxy
3. Set up PostgreSQL database
4. Run migrations: `npx prisma migrate deploy`
5. Start backend: `npm start`

## 📖 Documentation

- [Problem Statement](docs/problem_statement.md)
- [System Architecture](docs/system_architecture.md)
- [Database Design](docs/database_design.md)
- [API Specification](docs/api_specification.md)
- [AI/ML Design](docs/ai_ml_design.md)
- [Future Scope](docs/future_scope.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is proprietary software.

## 👥 Team

MedBroker Development Team

## 📞 Support

For issues and questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024
```