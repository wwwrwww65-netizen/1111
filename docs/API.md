# API Documentation

## Overview

This API is built using tRPC with Express.js, providing type-safe endpoints for the e-commerce platform.

## Base URL

- Development: `http://localhost:4000/trpc`
- Production: `https://api.yourapp.com/trpc`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```typescript
POST /trpc/auth.register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890" // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isVerified": false
  },
  "token": "jwt-token-here"
}
```

#### Login User
```typescript
POST /trpc/auth.login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isVerified": false
  },
  "token": "jwt-token-here"
}
```

#### Get Current User
```typescript
GET /trpc/auth.me
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "USER",
  "isVerified": false,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Profile
```typescript
POST /trpc/auth.updateProfile
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90210",
    "country": "USA"
  }
}
```

#### Change Password
```typescript
POST /trpc/auth.changePassword
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Products

#### Get All Products
```typescript
GET /trpc/products.getAll
```

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `category`: string (optional)
- `search`: string (optional)
- `sortBy`: string (optional)
- `sortOrder`: 'asc' | 'desc' (optional)

**Response:**
```json
{
  "products": [
    {
      "id": "product-123",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "images": ["image1.jpg", "image2.jpg"],
      "stock": 50,
      "isActive": true,
      "sku": "PROD-123",
      "categories": ["Electronics"],
      "rating": 4.5,
      "reviewCount": 10
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

#### Get Product by ID
```typescript
GET /trpc/products.getById
```

**Query Parameters:**
- `id`: string (required)

**Response:**
```json
{
  "id": "product-123",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "images": ["image1.jpg", "image2.jpg"],
  "stock": 50,
  "isActive": true,
  "sku": "PROD-123",
  "weight": 1.5,
  "dimensions": "10x5x2 inches",
  "categories": ["Electronics"],
  "variants": [
    {
      "id": "variant-1",
      "name": "Color",
      "value": "Red",
      "stock": 25
    }
  ],
  "reviews": [
    {
      "id": "review-1",
      "rating": 5,
      "comment": "Great product!",
      "user": {
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Email is required", "Password must be at least 8 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": "User with this email already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- CORS is enabled for specified origins
- Rate limiting is applied to prevent abuse
- Security headers are set using Helmet

## Development

To run the API locally:

```bash
cd packages/api
pnpm dev
```

The API will be available at `http://localhost:4000/trpc`

## Testing

To run tests:

```bash
cd packages/api
pnpm test
```

To run tests with coverage:

```bash
pnpm test:coverage
```