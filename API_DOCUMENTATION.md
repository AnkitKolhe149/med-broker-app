# API Documentation - MedIQ Platform

Complete REST API specification for the MedIQ medicine marketplace platform.

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication APIs](#authentication-apis)
3. [Medicine APIs](#medicine-apis)
4. [Order APIs](#order-apis)
5. [Vendor APIs](#vendor-apis)
6. [AI/ML APIs](#aiml-apis)
7. [Error Handling](#error-handling)

---

## API Overview

**Base URL:** `http://localhost:4000/api` (Development) | `https://api.mediq.com/api` (Production)  
**API Version:** v1  
**Response Format:** JSON  
**Authentication:** Bearer Token (JWT)  
**Rate Limit:** 100 requests per minute per IP

### Request Header Format
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: unique-request-id (optional)
```

### Standard Response Format

**Success Response (200-201):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "123",
    "name": "Medicine Name"
  },
  "message": "Request successful"
}
```

**Error Response (4xx-5xx):**
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email already registered",
    "details": {
      "field": "email",
      "reason": "Email must be unique"
    }
  }
}
```

### HTTP Status Codes
| Code | Meaning | Use Case |
|------|---------|----------|
| **200** | OK | Successful GET/PUT request |
| **201** | Created | Successful POST request |
| **204** | No Content | Successful DELETE request |
| **400** | Bad Request | Invalid input parameters |
| **401** | Unauthorized | Missing or invalid JWT token |
| **403** | Forbidden | Insufficient permissions for role |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (email, vendor code) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Server Error | Internal server error |

---

## Authentication APIs

### 1. Register User
**POST** `/auth/register`

Create a new user account as Customer or Vendor.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "9876543210",
  "role": "CUSTOMER"
}
```

**Parameters:**
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 8 characters, must contain uppercase, lowercase, number, special char
- `name` (string, required): Full name
- `phone` (string, required): 10-digit phone number
- `role` (string, required): Enum: CUSTOMER, VENDOR, ADMIN

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "newuser@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "isProfileComplete": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Cases:**
```json
// Email already registered
{
  "success": false,
  "status": 409,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email is already registered"
  }
}

// Invalid password
{
  "success": false,
  "status": 400,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Password must contain uppercase, lowercase, number, and special character"
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
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "isProfileComplete": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Token Details:**
- Format: JWT (JSON Web Token)
- Expiry: 7 days
- Signature: HS256
- Contains: User ID, Email, Role

---

### 3. Refresh Token
**POST** `/auth/refresh`

Get a new JWT token using the current valid token.

**Headers:**
```
Authorization: Bearer <current_jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Complete Profile (Vendor/Customer)
**POST** `/auth/complete-profile`

Complete role-specific onboarding.

**For Customer:**
```json
{
  "buyerType": "RETAIL",
  "businessName": null,
  "gstin": null,
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

**For Vendor:**
```json
{
  "vendorType": "PHARMACY",
  "businessName": "ABC Pharmacy",
  "gstin": "27AAFCU5055K1Z5",
  "drugLicense": "DL-001-2024",
  "address": "456 Business Plaza",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "isProfileComplete": true
    }
  },
  "message": "Profile completed successfully"
}
```

---

### 5. Logout
**POST** `/auth/logout`

Invalidate current session (frontend removes token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Medicine APIs

### 1. List All Medicines
**GET** `/medicines`

Retrieve paginated list of medicines with filters.

**Query Parameters:**
```
?page=1&limit=12&category=pain-relief&priceMin=100&priceMax=500&search=aspirin&sortBy=price&order=asc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 12 | Items per page (max 50) |
| category | string | null | Filter by medicine category |
| priceMin | number | 0 | Minimum price in ₹ |
| priceMax | number | 10000 | Maximum price in ₹ |
| search | string | null | Search by name or composition |
| sortBy | string | relevance | Sort field: price, rating, name, newest |
| order | string | asc | Sort order: asc, desc |
| vendorId | string | null | Filter by specific vendor |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": "med_123",
        "name": "Aspirin 500mg",
        "composition": "Acetylsalicylic Acid",
        "strength": "500mg",
        "manufacturer": "Pharma Corp",
        "category": "Pain Relief",
        "price": 50,
        "requiresPrescription": false,
        "rating": 4.5,
        "reviews": 120,
        "vendor": {
          "id": "vendor_abc",
          "name": "ABC Pharmacy",
          "rating": 4.7
        },
        "inStock": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 156,
      "totalPages": 13
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
    "id": "med_123",
    "name": "Aspirin 500mg",
    "composition": "Acetylsalicylic Acid",
    "strength": "500mg",
    "manufacturer": "Pharma Corp",
    "category": "Pain Relief",
    "price": 50,
    "description": "Effective for pain relief and fever",
    "requiresPrescription": false,
    "expiryDate": "2025-12-31",
    "storageRequirements": "Keep in cool, dry place",
    "sideEffects": "May cause mild gastric discomfort",
    "rating": 4.5,
    "reviews": 120,
    "vendor": {
      "id": "vendor_abc",
      "name": "ABC Pharmacy",
      "email": "contact@abcpharmacy.com",
      "rating": 4.7,
      "verificationStatus": "VERIFIED"
    },
    "inventory": {
      "inStock": true,
      "quantity": 450,
      "vendorId": "vendor_abc"
    }
  }
}
```

---

### 3. Add Medicine (Vendor Only)
**POST** `/medicines`

Add a new medicine to vendor's catalog.

**Authentication:** Required (Vendor role)

**Request Body:**
```json
{
  "name": "Paracetamol 650mg",
  "composition": "Paracetamol",
  "strength": "650mg",
  "manufacturer": "Pharma Corp",
  "category": "Pain Relief",
  "price": 45,
  "requiresPrescription": false,
  "description": "Fever and pain relief",
  "expiryDate": "2025-12-31",
  "storageRequirements": "Room temperature",
  "sideEffects": "Generally well tolerated"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "med_456",
    "name": "Paracetamol 650mg",
    "vendorId": "vendor_abc"
  },
  "message": "Medicine added successfully"
}
```

---

### 4. Update Medicine (Vendor Only)
**PUT** `/medicines/:medicineId`

Update medicine details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "med_456",
    "name": "Paracetamol 650mg",
    "price": 50
  },
  "message": "Medicine updated successfully"
}
```

---

## Order APIs

### 1. Create Order
**POST** `/orders`

Create a new order from cart items.

**Authentication:** Required (Customer role)

**Request Body:**
```json
{
  "items": [
    {
      "medicineId": "med_123",
      "quantity": 2,
      "price": 50
    },
    {
      "medicineId": "med_456",
      "quantity": 1,
      "price": 45
    }
  ],
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "deliveryType": "STANDARD"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789",
    "orderNumber": "ORD-2024-001",
    "customerId": "cust_123",
    "totalItems": 3,
    "totalAmount": 145,
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "items": [
      {
        "medicineId": "med_123",
        "name": "Aspirin 500mg",
        "quantity": 2,
        "price": 50,
        "subtotal": 100
      }
    ],
    "shippingAddress": {
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "message": "Order created successfully"
}
```

---

### 2. Get Order Details
**GET** `/orders/:orderId`

Retrieve order information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789",
    "orderNumber": "ORD-2024-001",
    "status": "SHIPPED",
    "totalAmount": 145,
    "items": [...],
    "payment": {
      "status": "COMPLETED",
      "amount": 145,
      "method": "CARD",
      "transactionId": "txn_12345"
    },
    "tracking": {
      "status": "IN_TRANSIT",
      "estimatedDelivery": "2024-01-20",
      "carrier": "FedEx",
      "trackingNumber": "FEDEX123456"
    }
  }
}
```

---

### 3. Get My Orders
**GET** `/orders`

Get list of customer's orders.

**Query Parameters:**
```
?page=1&limit=10&status=DELIVERED&sortBy=date&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order_789",
        "orderNumber": "ORD-2024-001",
        "status": "DELIVERED",
        "totalAmount": 145,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 4. Cancel Order
**POST** `/orders/:orderId/cancel`

Cancel a pending order.

**Conditions:**
- Order status must be PENDING or CONFIRMED
- Cannot cancel if already shipped

**Request Body (optional):**
```json
{
  "reason": "Changed mind"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789",
    "status": "CANCELLED",
    "refund": {
      "status": "INITIATED",
      "amount": 145
    }
  },
  "message": "Order cancelled and refund initiated"
}
```

---

## Vendor APIs

### 1. Get Vendor Profile
**GET** `/vendors/:vendorId`

Public vendor information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "vendorId": "vendor_abc",
    "businessName": "ABC Pharmacy",
    "vendorType": "PHARMACY",
    "rating": 4.7,
    "reviewCount": 450,
    "verificationStatus": "VERIFIED",
    "gstin": "27AAFCU5055K1Z5",
    "city": "Mumbai",
    "responseTime": "< 2 hours",
    "medicinesCount": 120,
    "totalOrders": 1250
  }
}
```

---

### 2. Get My Inventory (Vendor Only)
**GET** `/vendor/inventory`

Vendor's medicine inventory.

**Authentication:** Required (Vendor role)

**Query Parameters:**
```
?page=1&limit=20&sortBy=stock&order=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "inventoryId": "inv_123",
        "medicine": {
          "id": "med_123",
          "name": "Aspirin 500mg",
          "price": 50,
          "manufacturer": "Pharma Corp"
        },
        "quantity": 450,
        "reorderLevel": 50,
        "lastRestockDate": "2024-01-10T08:00:00Z",
        "status": "IN_STOCK"
      }
    ]
  }
}
```

---

### 3. Update Inventory
**PUT** `/vendor/inventory/:inventoryId`

Update stock levels.

**Request Body:**
```json
{
  "quantity": 500,
  "reorderLevel": 75
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inventoryId": "inv_123",
    "quantity": 500,
    "reorderLevel": 75
  }
}
```

---

### 4. Get My Orders (Vendor Only)
**GET** `/vendor/orders`

Orders from customers for vendor's medicines.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order_789",
        "orderNumber": "ORD-2024-001",
        "customerName": "John Doe",
        "medicines": ["Aspirin 500mg", "Paracetamol 500mg"],
        "totalAmount": 145,
        "status": "CONFIRMED",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## AI/ML APIs

### 1. Medicine Recommendation
**POST** `/ai/recommend`

Get personalized medicine recommendations.

**Request Body:**
```json
{
  "symptoms": "headache, fever",
  "age": 35,
  "gender": "MALE",
  "allergies": ["penicillin"],
  "existingConditions": ["hypertension"],
  "currentMedicines": ["Lisinopril"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "medicineId": "med_123",
        "name": "Paracetamol 650mg",
        "reason": "Effective for fever and headache",
        "confidence": 0.92,
        "price": 45,
        "vendor": {
          "id": "vendor_abc",
          "name": "ABC Pharmacy",
          "rating": 4.7
        }
      }
    ],
    "disclaimer": "This is an AI recommendation. Please consult a healthcare professional before purchasing prescription medicines."
  }
}
```

---

### 2. Disease Prediction
**POST** `/ai/predict-disease`

Predict possible diseases based on symptoms.

**Request Body:**
```json
{
  "symptoms": ["fever", "cough", "body ache"],
  "duration": "3 days",
  "severity": "moderate"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "disease": "Common Cold",
        "probability": 0.85,
        "symptoms_matched": ["fever", "cough"],
        "recommended_medicines": [
          {
            "name": "Paracetamol 500mg",
            "dosage": "500mg twice daily"
          }
        ]
      },
      {
        "disease": "Influenza",
        "probability": 0.65,
        "symptoms_matched": ["fever", "body ache", "cough"]
      }
    ],
    "disclaimer": "This is AI-generated prediction. Please consult a doctor for proper diagnosis."
  }
}
```

---

### 3. Chatbot Query
**POST** `/ai/chat`

Get instant responses from AI chatbot.

**Request Body:**
```json
{
  "message": "What should I take for a headache?",
  "context": {
    "userId": "cust_123",
    "previousMessages": []
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "response": "For headaches, common medicines include Paracetamol 500mg or Ibuprofen 400mg. Here are some options available on MedIQ...",
    "suggestions": [
      {
        "type": "medicine",
        "medicineId": "med_123",
        "name": "Paracetamol 650mg"
      },
      {
        "type": "action",
        "action": "view_doctor",
        "text": "Consult a healthcare professional"
      }
    ]
  }
}
```

---

## Error Handling

### Common Error Responses

**Authentication Error:**
```json
{
  "success": false,
  "status": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired JWT token"
  }
}
```

**Authorization Error:**
```json
{
  "success": false,
  "status": 403,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only vendors can access this endpoint"
  }
}
```

**Validation Error:**
```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "password": "Password too short"
    }
  }
}
```

**Resource Not Found:**
```json
{
  "success": false,
  "status": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "Medicine with id 'med_999' not found"
  }
}
```

---

## Rate Limiting

API requests are limited to prevent abuse:

- **Rate Limit**: 100 requests per minute per IP address
- **Headers Returned**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1705318200
  ```

If limit exceeded:
```json
{
  "success": false,
  "status": 429,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds."
  }
}
```

---

## Best Practices

1. **Always Include Authorization Header** for protected routes
2. **Validate Input** on frontend before sending requests
3. **Handle Errors Gracefully** and show user-friendly messages
4. **Use Pagination** for list endpoints (page, limit)
5. **Cache Responses** when appropriate (medicines list, vendor info)
6. **Log API Errors** for debugging
7. **Test Thoroughly** before deploying

---

## Testing

Use tools like Postman, Insomnia, or cURL to test APIs:

```bash
# Example: Login request
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# Example: Get medicines (with token)
curl -X GET "http://localhost:4000/api/medicines?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
