# API Specification

## Overview

MedBroker APIs follow **RESTful** principles with JSON request/response format. All endpoints require authentication via JWT token in the Authorization header (for protected routes).

**Base URL:** `http://localhost:5000/api`  
**API Version:** v1  
**Response Format:** JSON  
**Authentication:** Bearer Token (JWT)

---

## Authentication

### Request Header Format
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### HTTP Status Codes
- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Server error

---

## Auth Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account as Customer or Vendor.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

---

### 2. Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER"
    }
  }
}
```

---

### 3. Complete Profile
**POST** `/auth/complete-profile`

**Protected** - Requires authentication

Complete onboarding for new users.

**Request Body (Customer):**
```json
{
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "MH",
  "pincode": "400001"
}
```

**Request Body (Vendor):**
```json
{
  "businessName": "Apollo Pharmacy",
  "gstin": "27AAPCT1234A1Z5",
  "drugLicense": "DL-12345-ABC",
  "address": "456 Business Plaza",
  "city": "Mumbai",
  "state": "MH",
  "pincode": "400001",
  "bankAccount": "IBAN123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "id": "uuid",
    "profileComplete": true
  }
}
```

---

### 4. Logout
**POST** `/auth/logout`

**Protected** - Requires authentication

Invalidate user session.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Medicine Endpoints

### 1. Get All Medicines
**GET** `/medicines`

Retrieve paginated list of medicines with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 12) |
| search | string | Search by name/composition |
| category | uuid | Filter by category ID |
| minPrice | number | Minimum price filter |
| maxPrice | number | Maximum price filter |
| prescriptionOnly | boolean | Filter by prescription requirement |
| sortBy | string | relevance, price_asc, price_desc, rating |

**Example Request:**
```
GET /medicines?search=Aspirin&minPrice=10&maxPrice=500&category=uuid&page=1&limit=12
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": "uuid",
        "name": "Aspirin 500mg",
        "composition": "Acetylsalicylic Acid 500mg",
        "strength": "500mg",
        "manufacturer": "Bayer",
        "price": 45.00,
        "requiresPrescription": false,
        "category": "Pain Relief",
        "vendor": {
          "id": "uuid",
          "businessName": "Apollo Pharmacy",
          "rating": 4.5
        },
        "stock": 150,
        "rating": 4.2,
        "reviews": 25
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 120,
      "itemsPerPage": 12
    }
  }
}
```

---

### 2. Get Medicine Details
**GET** `/medicines/:medicineId`

Retrieve detailed information about a specific medicine.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Aspirin 500mg",
    "composition": "Acetylsalicylic Acid 500mg",
    "strength": "500mg",
    "quantity": "10 tablets",
    "manufacturer": "Bayer",
    "price": 45.00,
    "registrationNumber": "REG-12345",
    "expiryDate": "2026-12-31",
    "requiresPrescription": false,
    "category": {
      "id": "uuid",
      "name": "Pain Relief"
    },
    "vendor": {
      "id": "uuid",
      "businessName": "Apollo Pharmacy",
      "rating": 4.5,
      "totalOrders": 1250
    },
    "reviews": [
      {
        "id": "uuid",
        "customerId": "uuid",
        "rating": 5,
        "title": "Effective pain relief",
        "comment": "Works great for headaches",
        "createdAt": "2026-02-10T08:30:00Z"
      }
    ],
    "averageRating": 4.2,
    "totalReviews": 25,
    "inStock": true
  }
}
```

---

## Cart Endpoints

### 1. Add to Cart
**POST** `/cart/add`

**Protected** - Requires authentication

Add medicine to shopping cart.

**Request Body:**
```json
{
  "medicineId": "uuid",
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Added to cart",
  "data": {
    "cartId": "uuid",
    "medicineId": "uuid",
    "quantity": 2,
    "price": 45.00,
    "subtotal": 90.00
  }
}
```

---

### 2. Get Cart
**GET** `/cart`

**Protected** - Requires authentication

Retrieve user's shopping cart.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "medicineId": "uuid",
        "name": "Aspirin 500mg",
        "quantity": 2,
        "price": 45.00,
        "subtotal": 90.00
      }
    ],
    "subtotal": 450.00,
    "tax": 67.50,
    "total": 517.50,
    "itemCount": 3
  }
}
```

---

### 3. Update Cart Item
**PUT** `/cart/items/:cartItemId`

**Protected** - Requires authentication

Update quantity of item in cart.

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "itemId": "uuid",
    "quantity": 5,
    "subtotal": 225.00
  }
}
```

---

### 4. Remove from Cart
**DELETE** `/cart/items/:cartItemId`

**Protected** - Requires authentication

Remove item from cart.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Order Endpoints

### 1. Create Order
**POST** `/orders`

**Protected** - Requires authentication

Place a new order from cart items.

**Request Body:**
```json
{
  "shippingAddress": "123 Main St, Mumbai, MH 400001",
  "paymentMethod": "CREDIT_CARD"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-202602-001234",
    "customerId": "uuid",
    "totalAmount": 517.50,
    "status": "PENDING",
    "shippingAddress": "123 Main St",
    "estimatedDelivery": "2026-02-14T00:00:00Z",
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

---

### 2. Get Orders
**GET** `/orders`

**Protected** - Requires authentication

Retrieve user's orders with pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| status | string | Filter by status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-202602-001234",
        "totalAmount": 517.50,
        "status": "SHIPPED",
        "itemCount": 3,
        "trackingNumber": "TRACK123456",
        "estimatedDelivery": "2026-02-14",
        "createdAt": "2026-02-12T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 12
    }
  }
}
```

---

### 3. Get Order Details
**GET** `/orders/:orderId`

**Protected** - Requires authentication

Retrieve detailed information about a specific order.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-202602-001234",
    "customer": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "vendor": {
      "id": "uuid",
      "businessName": "Apollo Pharmacy"
    },
    "items": [
      {
        "id": "uuid",
        "medicineName": "Aspirin 500mg",
        "quantity": 2,
        "price": 45.00,
        "subtotal": 90.00
      }
    ],
    "subtotal": 450.00,
    "tax": 67.50,
    "discount": 0,
    "totalAmount": 517.50,
    "status": "SHIPPED",
    "payment": {
      "id": "uuid",
      "status": "SUCCESS",
      "method": "CREDIT_CARD",
      "transactionId": "TXN123456"
    },
    "shippingAddress": "123 Main St, Mumbai, MH 400001",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2026-02-14",
    "createdAt": "2026-02-12T10:00:00Z",
    "updatedAt": "2026-02-12T15:30:00Z"
  }
}
```

---

### 4. Cancel Order
**PUT** `/orders/:orderId/cancel`

**Protected** - Requires authentication

Cancel an order (only if status is PENDING).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "orderId": "uuid",
    "status": "CANCELLED",
    "refundStatus": "PROCESSING"
  }
}
```

---

## Payment Endpoints

### 1. Process Payment
**POST** `/payments/process`

**Protected** - Requires authentication

Process payment for an order.

**Request Body:**
```json
{
  "orderId": "uuid",
  "amount": 517.50,
  "method": "CREDIT_CARD",
  "cardToken": "tok_visa_4242"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transactionId": "TXN123456",
    "amount": 517.50,
    "status": "SUCCESS",
    "message": "Payment processed successfully",
    "receiptUrl": "https://..."
  }
}
```

---

### 2. Get Payment Status
**GET** `/payments/:paymentId`

**Protected** - Requires authentication

Check payment status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 517.50,
    "status": "SUCCESS",
    "method": "CREDIT_CARD",
    "transactionId": "TXN123456",
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

---

## User Profile Endpoints

### 1. Get Profile
**GET** `/users/profile`

**Protected** - Requires authentication

Retrieve authenticated user's profile.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "MH",
    "pincode": "400001",
    "profileComplete": true,
    "createdAt": "2026-02-01T00:00:00Z"
  }
}
```

---

### 2. Update Profile
**PUT** `/users/profile`

**Protected** - Requires authentication

Update user profile information.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "MH",
  "pincode": "400001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Review Endpoints

### 1. Create Review
**POST** `/reviews`

**Protected** - Requires authentication

Submit review for a medicine.

**Request Body:**
```json
{
  "medicineId": "uuid",
  "orderId": "uuid",
  "rating": 5,
  "title": "Excellent product",
  "comment": "Works perfectly as described"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "uuid",
    "rating": 5,
    "title": "Excellent product",
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

---

### 2. Get Reviews
**GET** `/medicines/:medicineId/reviews`

Get all reviews for a medicine.

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| page | integer |
| limit | integer |
| sortBy | rating, recent |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "customerName": "John Doe",
        "rating": 5,
        "title": "Excellent",
        "comment": "Great product",
        "isVerified": true,
        "createdAt": "2026-02-10T00:00:00Z"
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 25,
    "pagination": {}
  }
}
```

---

## Error Response Format

All errors follow this standard format:

**Response (400/401/404/500):**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error context"
  }
}
```

**Example:**
```json
{
  "success": false,
  "message": "Invalid request",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Email is required"
  }
}
```

---

## Rate Limiting

- **Public endpoints:** 100 requests/hour per IP
- **Authenticated endpoints:** 1000 requests/hour per user
- **Payment endpoints:** 50 requests/hour per user

---

## API Examples

### Complete Purchase Flow

1. **Register/Login** → Get JWT token
2. **Search medicines** → GET `/medicines?search=Aspirin`
3. **View details** → GET `/medicines/{id}`
4. **Add to cart** → POST `/cart/add`
5. **Create order** → POST `/orders`
6. **Process payment** → POST `/payments/process`
7. **Track order** → GET `/orders/{orderId}`
8. **Submit review** → POST `/reviews`
