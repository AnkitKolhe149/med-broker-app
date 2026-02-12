# Database Design

## Overview

MedBroker uses **PostgreSQL (Neon)** as its primary database with **Prisma ORM** for type-safe database operations. The database is designed to handle B2B and B2C transactions with support for medicine catalogs, orders, payments, and vendor management.

---

## Entity-Relationship Diagram (ERD)

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │─────┐
│ email (Unique)  │     │
│ name            │     │
│ phone           │     │
│ role            │     │
│ createdAt       │     │
│ updatedAt       │     │
└─────────────────┘     │
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────────┐   └──┬──────────┐  │
│    Customer      │      │          │  │
├──────────────────┤      │          │  │
│ id (FK to User)  │      │          │  │
│ address          │      │          │  │
│ city             │      │          │  │
│ state            │      │          │  │
│ pincode          │      │          │  │
│ createdAt        │      │          │  │
└──────────────────┘      │          │  │
                          │          │  │
                    ┌─────▼──┐   ┌──▼──┬────────────┐
                    │ Vendor │   │Admin│            │
                    ├────────┤   ├─────┤            │
                    │ id(FK) │   │id(FK│            │
                    │GSTIN   │   │     │            │
                    │License │   └─────┘            │
                    │Rating  │                      │
                    └────────┘                      │
                                            ┌───────▼──────────┐
                                            │    Medicine      │
                                            ├──────────────────┤
                                            │ id (PK)          │
                                            │ name             │
                                            │ composition      │
                                            │ strength         │
                                            │ manufacturer     │
                                            │ price            │
                                            │ categoryId (FK)  │
                                            │ vendorId (FK)    │
                                            │ requiresPrescription
                                            │ createdAt        │
                                            └──────────────────┘
                                                    │
                                                    │
                                            ┌───────▼──────────┐
                                            │   Inventory      │
                                            ├──────────────────┤
                                            │ id (PK)          │
                                            │ medicineId (FK)  │
                                            │ quantity         │
                                            │ reorderLevel     │
                                            │ lastRestockDate  │
                                            └──────────────────┘
```

---

## Core Tables

### 1. **User Table**
Stores all user accounts across the platform.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | String | UNIQUE, NOT NULL | User email address |
| password | String | NOT NULL | Hashed password (bcrypt) |
| name | String | NOT NULL | Full name |
| phone | String | - | Contact number |
| role | ENUM | NOT NULL | CUSTOMER \| VENDOR \| ADMIN |
| profileComplete | Boolean | DEFAULT: false | Onboarding status |
| isActive | Boolean | DEFAULT: true | Account status |
| createdAt | DateTime | DEFAULT: now() | Account creation date |
| updatedAt | DateTime | - | Last update date |

---

### 2. **Customer Table**
Extends User table with customer-specific information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY, FK(User.id) | Reference to User |
| address | String | - | Residential address |
| city | String | - | City name |
| state | String | - | State code |
| pincode | String | - | Postal code |
| gstin | String | UNIQUE | For business purchases |
| createdAt | DateTime | DEFAULT: now() | Registration date |
| updatedAt | DateTime | - | Last update date |

---

### 3. **Vendor Table**
Extends User table with vendor-specific information and verification.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY, FK(User.id) | Reference to User |
| gstin | String | UNIQUE, NOT NULL | Government Tax ID |
| drugLicense | String | UNIQUE, NOT NULL | Pharmacy license number |
| businessName | String | NOT NULL | Official business name |
| address | String | NOT NULL | Business address |
| city | String | NOT NULL | Business location |
| state | String | NOT NULL | State code |
| pincode | String | NOT NULL | Postal code |
| bankAccount | String | - | Account for payouts |
| rating | Decimal(2,1) | DEFAULT: 0 | Vendor rating (0-5) |
| totalOrders | Integer | DEFAULT: 0 | Total orders received |
| isVerified | Boolean | DEFAULT: false | Verification status |
| verificationDate | DateTime | - | When verified by admin |
| createdAt | DateTime | DEFAULT: now() | Registration date |
| updatedAt | DateTime | - | Last update date |

---

### 4. **Admin Table**
Extends User table with admin-specific permissions.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY, FK(User.id) | Reference to User |
| permissions | JSON | - | Admin capabilities |
| department | String | - | Department/team |
| createdAt | DateTime | DEFAULT: now() | Assignment date |
| updatedAt | DateTime | - | Last update date |

---

### 5. **Category Table**
Organizes medicines into categories for easy browsing.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Category identifier |
| name | String | UNIQUE, NOT NULL | Category name (e.g., Antibiotics) |
| description | String | - | Category details |
| icon | String | - | Category icon URL |
| createdAt | DateTime | DEFAULT: now() | Creation date |
| updatedAt | DateTime | - | Last update date |

---

### 6. **Medicine Table**
Core product catalog for all medicines.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Medicine identifier |
| name | String | NOT NULL | Medicine name |
| composition | String | NOT NULL | Active ingredients |
| strength | String | NOT NULL | Dosage strength |
| quantity | String | NOT NULL | Quantity per pack |
| manufacturer | String | NOT NULL | Manufacturer name |
| batchNumber | String | - | Medicine batch |
| expiryDate | DateTime | - | Expiry date |
| price | Decimal(10,2) | NOT NULL | Selling price (₹) |
| registrationNumber | String | - | Regulatory approval number |
| requiresPrescription | Boolean | DEFAULT: false | Prescription requirement |
| categoryId | UUID | FK(Category.id) | Medicine category |
| vendorId | UUID | FK(Vendor.id) | Selling vendor |
| createdAt | DateTime | DEFAULT: now() | Added to catalog |
| updatedAt | DateTime | - | Last update date |

---

### 7. **Inventory Table**
Tracks stock levels for each medicine at each vendor.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Inventory record ID |
| medicineId | UUID | FK(Medicine.id) | Medicine reference |
| vendorId | UUID | FK(Vendor.id) | Vendor holding stock |
| quantity | Integer | NOT NULL, ≥0 | Current stock level |
| reorderLevel | Integer | - | Minimum stock threshold |
| lastRestockDate | DateTime | - | Last restocking date |
| createdAt | DateTime | DEFAULT: now() | Record creation |
| updatedAt | DateTime | - | Last update date |

---

### 8. **Order Table**
Main order records for customer purchases.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Order identifier |
| orderNumber | String | UNIQUE | Human-readable order ID |
| customerId | UUID | FK(Customer.id) | Purchasing customer |
| vendorId | UUID | FK(Vendor.id) | Fulfilling vendor |
| totalAmount | Decimal(10,2) | NOT NULL | Order total (₹) |
| taxAmount | Decimal(10,2) | - | Tax/GST amount |
| discountAmount | Decimal(10,2) | DEFAULT: 0 | Applied discount |
| shippingAddress | String | NOT NULL | Delivery address |
| status | ENUM | DEFAULT: PENDING | PENDING \| PROCESSING \| SHIPPED \| DELIVERED \| CANCELLED |
| paymentId | UUID | FK(Payment.id) | Payment reference |
| trackingNumber | String | - | Shipping tracking ID |
| estimatedDelivery | DateTime | - | Expected delivery date |
| createdAt | DateTime | DEFAULT: now() | Order date |
| updatedAt | DateTime | - | Last status update |
| completedAt | DateTime | - | Delivery completion date |

---

### 9. **OrderItem Table**
Individual line items within an order.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Item identifier |
| orderId | UUID | FK(Order.id) | Parent order |
| medicineId | UUID | FK(Medicine.id) | Medicine ordered |
| quantity | Integer | NOT NULL, >0 | Quantity ordered |
| price | Decimal(10,2) | NOT NULL | Unit price at purchase |
| subtotal | Decimal(10,2) | NOT NULL | quantity × price |
| createdAt | DateTime | DEFAULT: now() | Item added date |

---

### 10. **Payment Table**
Records all payment transactions.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Payment identifier |
| orderId | UUID | FK(Order.id) | Associated order |
| customerId | UUID | FK(Customer.id) | Paying customer |
| amount | Decimal(10,2) | NOT NULL | Payment amount (₹) |
| method | ENUM | NOT NULL | CREDIT_CARD \| DEBIT_CARD \| UPI \| NETBANKING \| WALLET |
| transactionId | String | UNIQUE | Gateway transaction ID |
| status | ENUM | DEFAULT: PENDING | PENDING \| SUCCESS \| FAILED \| REFUNDED |
| gatewayResponse | JSON | - | Payment gateway response |
| createdAt | DateTime | DEFAULT: now() | Payment date |
| updatedAt | DateTime | - | Last status update |

---

### 11. **Invoice Table**
Digital invoices for orders.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Invoice identifier |
| invoiceNumber | String | UNIQUE | Invoice number |
| orderId | UUID | FK(Order.id) | Associated order |
| vendorId | UUID | FK(Vendor.id) | Issuing vendor |
| subtotal | Decimal(10,2) | NOT NULL | Before tax/discount |
| taxAmount | Decimal(10,2) | - | Tax/GST |
| totalAmount | Decimal(10,2) | NOT NULL | Final amount |
| issueDate | DateTime | DEFAULT: now() | Invoice date |
| dueDate | DateTime | - | Payment due date |
| pdfUrl | String | - | PDF document URL |
| createdAt | DateTime | DEFAULT: now() | Creation date |

---

### 12. **Review Table**
Customer reviews and ratings for medicines.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Review identifier |
| medicineId | UUID | FK(Medicine.id) | Reviewed medicine |
| customerId | UUID | FK(Customer.id) | Reviewer |
| orderId | UUID | FK(Order.id) | Purchase reference |
| rating | Integer | NOT NULL, 1-5 | Star rating |
| title | String | - | Review headline |
| comment | String | - | Detailed review |
| isVerified | Boolean | DEFAULT: false | Verified purchase |
| helpful | Integer | DEFAULT: 0 | Helpful count |
| createdAt | DateTime | DEFAULT: now() | Review date |
| updatedAt | DateTime | - | Last edit date |

---

### 13. **Cart Table**
Shopping cart for customers.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Cart identifier |
| customerId | UUID | FK(Customer.id) | Cart owner |
| createdAt | DateTime | DEFAULT: now() | Cart creation |
| updatedAt | DateTime | - | Last modification |

---

### 14. **CartItem Table**
Items in customer shopping carts.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | UUID | PRIMARY KEY | Item identifier |
| cartId | UUID | FK(Cart.id) | Parent cart |
| medicineId | UUID | FK(Medicine.id) | Added medicine |
| quantity | Integer | NOT NULL, >0 | Item quantity |
| addedAt | DateTime | DEFAULT: now() | When added |

---

## Database Relationships

### One-to-Many
- **User → Customer/Vendor/Admin** (1:1 inheritance)
- **Vendor → Medicine** (1 vendor : many medicines)
- **Category → Medicine** (1 category : many medicines)
- **Medicine → Inventory** (1 medicine : many inventory records)
- **Order → OrderItem** (1 order : many items)
- **Order → Payment** (1 order : 1 payment)
- **Order → Invoice** (1 order : 1 invoice)
- **Customer → Review** (1 customer : many reviews)
- **Medicine → Review** (1 medicine : many reviews)
- **Cart → CartItem** (1 cart : many items)

### Many-to-Many
- **Vendor ← Medicine → Customer** (indirect through Order)

---

## Indexing Strategy

**Performance Indexes:**
```sql
-- Fast user lookups
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- Medicine search
CREATE INDEX idx_medicine_name ON "Medicine"(name);
CREATE INDEX idx_medicine_composition ON "Medicine"(composition);
CREATE INDEX idx_medicine_vendor ON "Medicine"("vendorId");
CREATE INDEX idx_medicine_category ON "Medicine"("categoryId");

-- Order tracking
CREATE INDEX idx_order_customer ON "Order"("customerId");
CREATE INDEX idx_order_vendor ON "Order"("vendorId");
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_order_created ON "Order"("createdAt");

-- Payment
CREATE INDEX idx_payment_order ON "Payment"("orderId");
CREATE INDEX idx_payment_customer ON "Payment"("customerId");

-- Inventory
CREATE INDEX idx_inventory_medicine ON "Inventory"("medicineId");
CREATE INDEX idx_inventory_vendor ON "Inventory"("vendorId");

-- Review
CREATE INDEX idx_review_medicine ON "Review"("medicineId");
CREATE INDEX idx_review_customer ON "Review"("customerId");
```

---

## Data Constraints & Validations

### Business Rules
1. **Medicine Price:** Must be > 0
2. **Inventory Quantity:** Must be ≥ 0
3. **Order Status:** Can only transition in one direction (PENDING → PROCESSING → SHIPPED → DELIVERED)
4. **Payment:** Each order must have exactly one payment
5. **Vendor Verification:** Required before medicines can be listed
6. **Review Rating:** Must be between 1-5
7. **Prescription Medicines:** Cannot be sold without verification
8. **Unique Constraints:**
   - User email (unique per platform)
   - GSTIN/Drug License (unique per vendor)
   - Order number (unique identifier)
   - Invoice number (unique identifier)
   - Transaction ID (unique from payment gateway)

---

## Data Integrity

**Cascade Delete Rules:**
- If Vendor is deleted → Delete all their Medicines
- If Medicine is deleted → Remove from Carts & Orders
- If Customer is deleted → Soft delete (preserve order history)

**Soft Deletes:**
- User accounts marked as inactive instead of deleted
- Maintains audit trail and order history

---

## Database Growth Estimation

| Entity | Estimated Records | Growth |
|--------|-------------------|--------|
| Users | 10,000 | +100/day |
| Medicines | 50,000 | +50/day |
| Orders | 100,000 | +200/day |
| OrderItems | 250,000 | +500/day |
| Reviews | 50,000 | +150/day |

---

## Backup & Recovery

- **Neon PostgreSQL** provides:
  - Automatic daily backups
  - Point-in-time recovery
  - Replication to secondary datacenter
  - 99.99% uptime SLA
