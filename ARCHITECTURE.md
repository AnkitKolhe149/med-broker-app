# System Architecture - MedIQ Platform

Complete technical architecture and database design for the MedIQ medicine marketplace platform.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Layers](#system-layers)
4. [Database Design](#database-design)
5. [Data Flow](#data-flow)

---

## Architecture Overview

MedIQ is built using a **3-tier microservices architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                   │
│               React 18.2.0 + Vite 6.4.1              │
│         (Web App, Mobile Responsive Design)          │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/REST API
                     │
┌────────────────────▼─────────────────────────────────┐
│              APPLICATION LAYER                       │
│          Node.js + Express 4.18.2 + Prisma          │
│   (Business Logic, Authentication, API Gateway)      │
└────────────────────┬─────────────────────────────────┘
                     │ Database Queries
                     │ & API Calls
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
        ▼            ▼            ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│PostgreSQL│ │Python ML │ │Payment   │ │Azure Storage │
│Database  │ │Services  │ │Gateway   │ │ (File Upload)│
│(Neon)    │ │(Flask)   │ │(Stripe)  │ └──────────────┘
└──────────┘ └──────────┘ └──────────┘
DATA LAYER
```

---

## Technology Stack

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | React | 18.2.0 |
| **Build Tool** | Vite | 6.4.1 |
| **Routing** | React Router | 6.22.3 |
| **HTTP Client** | Axios | - |
| **State Management** | Context API + Custom Hooks | - |
| **Styling** | CSS3 + Responsive Design | - |
| **Package Manager** | npm | - |

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 4.18.2 |
| **ORM** | Prisma | 5.22.0 |
| **Authentication** | JWT + Bcrypt | - |
| **Validation** | Custom Middleware | - |
| **File Upload** | Multer | - |
| **Logging** | Winston/Custom Logger | - |

### Database
| Component | Technology | Details |
|-----------|-----------|---------|
| **Primary DB** | PostgreSQL | Neon Cloud Hosting |
| **Schema Sync** | Prisma Migrations | Version-controlled |
| **Connection Pooling** | Neon Pools | Built-in |

### AI/ML Services
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Flask | Python REST APIs |
| **Deep Learning** | PyTorch (LSTM) | Time-series demand forecasting (PMC9540101) |
| **ML Libraries** | scikit-learn | Classic ML, metrics, and preprocessing |
| **Data Processing** | pandas + numpy | Data manipulation |

### Infrastructure
| Component | Service | Purpose |
|-----------|---------|---------|
| **Database Hosting** | Neon PostgreSQL | Managed cloud database |
| **File Storage** | Azure Blob Storage | User uploads, invoices, documents |
| **Payment Gateway** | Stripe/Razorpay Ready | Payment processing |
| **CI/CD** | GitHub Actions Ready | Automated testing & deployment |

---

## System Layers

### 1. **Frontend Tier** (Client Layer)

**Responsibilities:**
- User interface and user experience
- Form handling and validation
- API communication
- Local state management
- Authentication token management

**Key Pages & Features:**
- **Landing Page**: Hero, features showcase, trust indicators
- **Authentication**: Login, Register, Role Selection
- **Onboarding**: Role-specific forms (Customer/Vendor)
- **Customer Catalog**: 4-column grid, advanced filters, search, sorting
- **Product Details**: Medicine info, reviews, ratings
- **Cart Management**: Add/remove items, quantity adjustment
- **Checkout & Payment**: Order confirmation
- **Customer Dashboard**: Orders, profile, order history
- **Vendor Dashboard**: Inventory, orders, analytics
- **Admin Dashboard**: Vendor approvals, user management

**Design System:**
- **Primary Color**: Medical Green (#00A86B) - Trust & Healthcare
- **Accent Color**: Medical Blue (#0088CC)
- **Typography**: Inter (Body), Playfair Display (Headers)
- **Component Library**: Custom-built responsive components
- **Responsive Breakpoints**:
  - Desktop: 1024px+
  - Tablet: 768px - 1023px
  - Mobile: < 768px

**State Management Architecture:**
```
App (Context)
├── Auth Context (User, Token, Role)
├── Cart Context (Items, Total)
├── User Context (Profile, Preferences)
└── Loading/Error Context (Global States)
```

---

### 2. **Backend Tier** (Application Layer)

**Responsibilities:**
- Request validation and sanitization
- Business logic implementation
- Database operations
- API security and authentication
- Error handling and logging
- Rate limiting and throttling

**Core Modules:**

#### Authentication Module
```
routes/auth → controller → service → prisma → database
   ↓
- User registration with role selection
- Password hashing with bcrypt
- JWT token generation (7-day expiry)
- Token refresh mechanism
- Logout handling
```

#### Medicines Module
```
routes/medicines → controller → service → prisma → database
   ↓
- List medicines with pagination
- Advanced filtering (price, category, vendor)
- Search functionality
- Add/edit medicine (vendor only)
- Inventory management
- Price management
```

#### Orders Module
```
routes/orders → controller → service → prisma → database
   ↓
- Create orders from cart
- Order status tracking
- Order history retrieval
- Invoice generation
- Order cancellation/returns
```

#### Vendors Module
```
routes/vendors → controller → service → prisma → database
   ↓
- Vendor profile management
- GSTIN & License verification
- Vendor ratings & reviews
- Inventory management
- Sales analytics
```

#### Users Module
```
routes/users → controller → service → prisma → database
   ↓
- User profile management
- Role-specific profile completion
- Address management
- Preferences
- Document uploads
```

**Middleware Stack:**
```
Request
  ↓
[CORS Middleware]
  ↓
[Body Parser Middleware]
  ↓
[Authentication Middleware] - Verify JWT
  ↓
[Authorization Middleware] - Check Role/Permissions
  ↓
[Validation Middleware] - Validate Request Data
  ↓
[Rate Limiter] - Prevent Abuse
  ↓
[Route Handler] - Business Logic
  ↓
[Error Handler] - Centralized Error Catching
  ↓
Response
```

---

### 3. **Database Tier** (Data Layer)

**PostgreSQL Database Schema:**

#### Core Tables

**User Table** (Base for all users)
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  phone       String?
  role        Role     @default(CUSTOMER) // CUSTOMER, VENDOR, ADMIN
  passwordHash String
  isProfileComplete Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  customer    Customer?
  vendor      Vendor?
  orders      Order[]
  reviews     Review[]
}

enum Role {
  CUSTOMER
  VENDOR
  ADMIN
}
```

**Customer Table** (Extended from User)
```prisma
model Customer {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  buyerType   BuyerType // RETAIL, WHOLESALE
  businessName String?
  gstin       String?
  
  addresses   Address[]
  orders      Order[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum BuyerType {
  RETAIL
  WHOLESALE
}
```

**Vendor Table** (Extended from User)
```prisma
model Vendor {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  vendorType    VendorType // MANUFACTURER, DISTRIBUTOR, PHARMACY
  gstin         String
  drugLicense   String
  verificationStatus VerificationStatus
  rating        Float   @default(0)
  
  medicines     Medicine[]
  inventory     Inventory[]
  orders        Order[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum VendorType {
  MANUFACTURER
  DISTRIBUTOR
  PHARMACY
  WHOLESALER
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

**Medicine Table**
```prisma
model Medicine {
  id                  String   @id @default(cuid())
  name                String   @unique
  composition         String
  strength            String
  manufacturer        String
  category            String
  price               Float    // Base price in ₹
  requiresPrescription Boolean @default(false)
  description         String?
  
  vendorId            String
  vendor              Vendor   @relation(fields: [vendorId], references: [id])
  
  inventory           Inventory[]
  orderItems          OrderItem[]
  reviews             Review[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

**Inventory Table**
```prisma
model Inventory {
  id              String   @id @default(cuid())
  medicineId      String
  medicine        Medicine @relation(fields: [medicineId], references: [id])
  
  vendorId        String
  vendor          Vendor   @relation(fields: [vendorId], references: [id])
  
  quantity        Int
  reorderLevel    Int
  lastRestockDate DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([medicineId, vendorId])
}
```

**Order Table**
```prisma
model Order {
  id            String   @id @default(cuid())
  orderNumber   String   @unique
  
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  
  vendorId      String?
  vendor        Vendor?  @relation(fields: [vendorId], references: [id])
  
  items         OrderItem[]
  payment       Payment?
  
  status        OrderStatus @default(PENDING)
  totalAmount   Float
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}
```

**Payment Table**
```prisma
model Payment {
  id            String   @id @default(cuid())
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  
  amount        Float
  currency      String   @default("INR")
  status        PaymentStatus @default(PENDING)
  
  paymentMethod PaymentMethod
  transactionId String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  UPI
  NET_BANKING
  WALLET
}
```

#### Relationships Diagram

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─→ Customer ──────┐
     │                  ├──→ Address
     ├─→ Vendor ────────┤
     │                  ├──→ Medicine ──→ Inventory
     └─→ Review────────┘
```

---

## Data Flow

### User Registration Flow
```
1. User submits form (email, password, role)
   |
2. Frontend validates input
   |
3. POST /api/auth/register → Backend
   |
4. Backend validates email uniqueness
   |
5. Hash password with bcrypt
   |
6. Create User record in database
   |
7. Create role-specific record (Customer/Vendor)
   |
8. Generate JWT token
   |
9. Return token to frontend
   |
10. Frontend stores in localStorage
    |
11. Redirect to onboarding or dashboard
```

### Medicine Purchase Flow
```
1. Customer browses medicines
   |
2. GET /api/medicines?category=pain-relief&price=100-500
   |
3. Backend filters from Inventory + Medicine tables
   |
4. Returns paginated results with vendor info
   |
5. Customer adds to cart (localStorage)
   |
6. POST /api/orders → Create order
   |
7. Backend creates Order + OrderItem records
   |
8. POST /api/payments → Process payment
   |
9. Backend creates Payment record
   |
10. Order status: PENDING → CONFIRMED → SHIPPED → DELIVERED
    |
11. Frontend tracks order via GET /api/orders/:id
```

---

## Performance Considerations

### Database Optimization
- **Indexing**: Indexes on frequently queried fields (email, role, medicineId)
- **Pagination**: API returns max 50 items per request
- **Connection Pooling**: Neon provides built-in connection pooling
- **Query Optimization**: Prisma includes relations only when needed

### API Performance
- **Caching**: Browser cache for static assets
- **Compression**: gzip compression for responses
- **Rate Limiting**: 100 requests per minute per IP
- **CDN Ready**: Static assets can be served from CDN

### Frontend Optimization
- **Code Splitting**: Load components on demand with React.lazy
- **Bundle Size**: Vite optimizes build output
- **Image Optimization**: Compress medical images
- **Lazy Loading**: Infinite scroll for medicine catalog

---

## Security Implementation

1. **Authentication**: JWT tokens with 7-day expiry
2. **Password Security**: Bcrypt hashing with salt rounds 10
3. **Authorization**: Role-based middleware checks
4. **Input Validation**: Sanitize all user inputs
5. **CORS**: Whitelist allowed origins
6. **Rate Limiting**: Prevent brute force attacks
7. **HTTPS**: All communication encrypted (production)
8. **SQL Injection Prevention**: Prisma parameterized queries

---

## Scalability Strategy

### Horizontal Scaling
- Stateless backend services can run on multiple instances
- Load balancer distributes requests
- Database connection pooling handles concurrent users

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Database query optimization
- Caching layer (Redis) for hot data

### Planned Improvements
- Microservices for AI/ML (separate from main backend)
- Message queue (RabbitMQ) for async operations
- Elasticsearch for advanced medicine search
- Redis caching layer for frequently accessed data
