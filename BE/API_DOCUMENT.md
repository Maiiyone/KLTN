# API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
  - [Quick Reference](#quick-reference)
  - [Register](#register-new-user)
  - [Login](#login)
  - [Get Profile](#get-current-user-profile)
- [Products](#products)
- [Orders](#orders)
- [Reviews](#reviews)
- [Admin - User Management](#admin---user-management)
- [Admin - Product Management](#admin---product-management)
- [Admin - Order Management](#admin---order-management)
- [Admin - Dashboard](#admin---dashboard)
- [Error Codes](#error-codes)
- [Data Models](#data-models)
- [Notes & Security](#notes)
- [Changelog](#changelog)
- [Migration Guide](#migration-guide)
- [FAQ](#faq-frequently-asked-questions)
- [Example Usage](#example-usage)

---

## Overview

Base URL: `http://your-domain.com/api/v1`

All API responses are in JSON format. Timestamps are in ISO 8601 format with timezone information.

### Authentication
Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

### Key Features
- **Flexible Login**: Login with username OR email address
- **JWT Authentication**: Secure token-based authentication
- **Admin Dashboard**: Comprehensive admin panel with statistics
- **Pagination**: All list endpoints support pagination
- **Search & Filters**: Advanced search and filtering capabilities
- **Development Tools**: Admin bypass for easier testing (development only)

### Quick Links
- [Login Documentation](#login) - How to authenticate users
- [Admin APIs](#admin---user-management) - Admin-only endpoints
- [Error Codes](#error-codes) - HTTP status codes and error handling
- [Migration Guide](#migration-guide) - Upgrading from previous versions
- [Security](#security-considerations) - Production security guidelines

---

## Authentication

### Quick Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/register` | POST | No | Register new user account |
| `/auth/login` | POST | No | Login with username/email + password |
| `/auth/me` | GET | Yes | Get current user profile |
| `/auth/change-password` | POST | No | Change user password |

**Login Options:**
- ✅ Login with username: `{"username_or_email": "johndoe", "password": "..."}`
- ✅ Login with email: `{"username_or_email": "user@example.com", "password": "..."}`
- ✅ Admin bypass: `{"username_or_email": "admin@gmail.com", "password": "anything"}` (dev only)

---

### Register New User

**Endpoint:** `POST /auth/register`

**Description:** Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "0123456789",
  "address": "123 Main St, City"
}
```

**Request Schema:**
- `email` (string, required): Valid email address
- `username` (string, required): Unique username
- `password` (string, required): User password
- `full_name` (string, optional): User's full name
- `phone` (string, optional): Phone number
- `address` (string, optional): User address

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "phone": "0123456789",
  "address": "123 Main St, City",
  "role": "customer",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00"
}
```

**Error Responses:**
- `400 Bad Request`:
  ```json
  {
    "detail": "Email already registered"
  }
  ```
  or
  ```json
  {
    "detail": "Username already taken"
  }
  ```

---

### Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive access token. Supports login with either username or email.

**Special Feature:** Users with email `admin@gmail.com` can login without password verification (for development/testing purposes).

**Request Body:**
```json
{
  "username_or_email": "johndoe",
  "password": "securePassword123"
}
```
or
```json
{
  "username_or_email": "user@example.com",
  "password": "securePassword123"
}
```

**Request Schema:**
- `username_or_email` (string, required): Username or email address
- `password` (string, required): User password (not verified for admin@gmail.com)

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Response (401):**
```json
{
  "detail": "Incorrect username/email or password"
}
```

**Examples:**

Login with username:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username_or_email": "johndoe", "password": "mypassword"}'
```

Login with email:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username_or_email": "user@example.com", "password": "mypassword"}'
```

Login as admin@gmail.com (password bypass):
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username_or_email": "admin@gmail.com", "password": "anything"}'
```

---

### Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Get the current authenticated user's profile.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "phone": "0123456789",
  "address": "123 Main St, City",
  "role": "customer",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00"
}
```

**Error Response (401):**
```json
{
  "detail": "Not authenticated"
}
```

---

## Products

### Get Products List

**Endpoint:** `GET /products`

**Description:** Get a list of products with pagination and optional search.

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20): Items per page
- `search` (string, optional): Search term for product name

**Example Request:**
```
GET /products?page=1&limit=20&search=apple
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "product_code": "PROD001",
    "product_id": "P001",
    "title": "Fresh Apple",
    "product_name": "Organic Red Apple",
    "current_price": 50000,
    "current_price_text": "50.000đ",
    "unit": "gam",
    "original_price": 60000,
    "original_price_text": "60.000đ",
    "discount_percent": 17,
    "discount_text": "-17%",
    "product_url": "https://example.com/products/apple",
    "image_url": "https://example.com/images/apple.jpg",
    "image_alt": "Fresh Red Apple",
    "is_active": true,
    "created_at": "2024-01-01T10:00:00+00:00",
    "average_rating": 4.5,
    "review_count": 10
  }
]
```

---

### Get Single Product

**Endpoint:** `GET /products/{product_id}`

**Description:** Get detailed information about a specific product.

**Path Parameters:**
- `product_id` (integer, required): Product ID

**Example Request:**
```
GET /products/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "product_code": "PROD001",
  "product_id": "P001",
  "title": "Fresh Apple",
  "product_name": "Organic Red Apple",
  "current_price": 50000,
  "current_price_text": "50.000đ",
  "unit": "gam",
  "original_price": 60000,
  "original_price_text": "60.000đ",
  "discount_percent": 17,
  "discount_text": "-17%",
  "product_url": "https://example.com/products/apple",
  "image_url": "https://example.com/images/apple.jpg",
  "image_alt": "Fresh Red Apple",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "average_rating": 4.5,
  "review_count": 10
}
```

**Error Response (404):**
```json
{
  "detail": "Product not found"
}
```

---

## Orders

### Create Order

**Endpoint:** `POST /orders`

**Description:** Create a new order for the authenticated user.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "shipping_address": "123 Main St, City, Country",
  "notes": "Please deliver before 5 PM",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

**Request Schema:**
- `shipping_address` (string, required): Delivery address
- `notes` (string, optional): Additional notes for the order
- `items` (array, required): List of order items
  - `product_id` (integer, required): Product ID
  - `quantity` (integer, required): Quantity to order

**Success Response (200):**
```json
{
  "id": 100,
  "order_number": "ORD-20240101-001",
  "total_amount": 150000.0,
  "status": "pending",
  "payment_status": "pending",
  "shipping_address": "123 Main St, City, Country",
  "notes": "Please deliver before 5 PM",
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-01T10:00:00+00:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Organic Red Apple",
      "quantity": 2,
      "unit_price": 50000.0,
      "total_price": 100000.0
    },
    {
      "id": 2,
      "product_id": 3,
      "product_name": "Fresh Banana",
      "quantity": 1,
      "unit_price": 50000.0,
      "total_price": 50000.0
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`:
  ```json
  {
    "detail": "Product not found or out of stock"
  }
  ```
- `401 Unauthorized`:
  ```json
  {
    "detail": "Not authenticated"
  }
  ```

---

### Get User Orders

**Endpoint:** `GET /orders`

**Description:** Get all orders for the authenticated user with pagination.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20): Items per page

**Example Request:**
```
GET /orders?page=1&limit=20
```

**Success Response (200):**
```json
[
  {
    "id": 100,
    "order_number": "ORD-20240101-001",
    "total_amount": 150000.0,
    "status": "pending",
    "payment_status": "pending",
    "shipping_address": "123 Main St, City, Country",
    "notes": "Please deliver before 5 PM",
    "created_at": "2024-01-01T10:00:00+00:00",
    "updated_at": "2024-01-01T10:00:00+00:00",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Organic Red Apple",
        "quantity": 2,
        "unit_price": 50000.0,
        "total_price": 100000.0
      }
    ]
  }
]
```

---

### Get Single Order

**Endpoint:** `GET /orders/{order_id}`

**Description:** Get detailed information about a specific order.

**Authentication:** Required

**Path Parameters:**
- `order_id` (integer, required): Order ID

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```
GET /orders/100
```

**Success Response (200):**
```json
{
  "id": 100,
  "order_number": "ORD-20240101-001",
  "total_amount": 150000.0,
  "status": "pending",
  "payment_status": "pending",
  "shipping_address": "123 Main St, City, Country",
  "notes": "Please deliver before 5 PM",
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-01T10:00:00+00:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Organic Red Apple",
      "quantity": 2,
      "unit_price": 50000.0,
      "total_price": 100000.0
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Order not found"
  }
  ```
- `401 Unauthorized`:
  ```json
  {
    "detail": "Not authenticated"
  }
  ```

---

## Reviews

### Create Review

**Endpoint:** `POST /reviews`

**Description:** Create a review for a product.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "rating": 5,
  "comment": "Excellent product! Very fresh and tasty."
}
```

**Request Schema:**
- `product_id` (integer, required): Product ID
- `rating` (integer, required): Rating from 1 to 5
- `comment` (string, optional): Review comment

**Success Response (200):**
```json
{
  "message": "Review created successfully",
  "review_id": 50
}
```

**Error Response (401):**
```json
{
  "detail": "Not authenticated"
}
```

---

### Get Product Reviews

**Endpoint:** `GET /reviews/products/{product_id}`

**Description:** Get all reviews for a specific product with pagination.

**Path Parameters:**
- `product_id` (integer, required): Product ID

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20): Items per page

**Example Request:**
```
GET /reviews/products/1?page=1&limit=20
```

**Success Response (200):**
```json
{
  "reviews": [
    {
      "id": 50,
      "user_id": 10,
      "username": "johndoe",
      "product_id": 1,
      "rating": 5,
      "comment": "Excellent product! Very fresh and tasty.",
      "is_verified_purchase": true,
      "created_at": "2024-01-01T10:00:00+00:00"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### Get My Reviews

**Endpoint:** `GET /reviews/my-reviews`

**Description:** Get all reviews created by the authenticated user.

**Authentication:** Required

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20): Items per page

**Example Request:**
```
GET /reviews/my-reviews?page=1&limit=20
```

**Success Response (200):**
```json
{
  "reviews": [
    {
      "id": 50,
      "user_id": 10,
      "username": "johndoe",
      "product_id": 1,
      "rating": 5,
      "comment": "Excellent product! Very fresh and tasty.",
      "is_verified_purchase": true,
      "created_at": "2024-01-01T10:00:00+00:00"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

**Error Response (401):**
```json
{
  "detail": "Not authenticated"
}
```

---

## Admin - User Management

### Get All Users

**Endpoint:** `GET /admin/users`

**Description:** Get all users with filters and pagination (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1, min: 1): Page number
- `limit` (integer, optional, default: 20, min: 1, max: 100): Items per page
- `search` (string, optional): Search term for username or email
- `role` (string, optional): Filter by role ("customer" or "admin")
- `is_active` (boolean, optional): Filter by active status

**Example Request:**
```
GET /admin/users?page=1&limit=20&search=john&role=customer&is_active=true
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "phone": "0123456789",
      "address": "123 Main St, City",
      "role": "customer",
      "is_active": true,
      "created_at": "2024-01-01T10:00:00+00:00",
      "updated_at": "2024-01-02T10:00:00+00:00",
      "total_orders": 5,
      "total_spent": 500000.0
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5,
  "has_next": true,
  "has_prev": false
}
```

**Error Response (403):**
```json
{
  "detail": "Not enough permissions"
}
```

---

### Get Single User

**Endpoint:** `GET /admin/users/{user_id}`

**Description:** Get detailed information about a specific user (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `user_id` (integer, required): User ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Request:**
```
GET /admin/users/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "phone": "0123456789",
  "address": "123 Main St, City",
  "role": "customer",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-02T10:00:00+00:00",
  "total_orders": 5,
  "total_spent": 500000.0
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "User not found"
  }
  ```
- `403 Forbidden`:
  ```json
  {
    "detail": "Not enough permissions"
  }
  ```

---

### Update User

**Endpoint:** `PUT /admin/users/{user_id}`

**Description:** Update user information (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `user_id` (integer, required): User ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "full_name": "John Updated Doe",
  "phone": "0987654321",
  "address": "456 New St, City",
  "role": "admin",
  "is_active": false
}
```

**Request Schema (all fields optional):**
- `full_name` (string): User's full name
- `phone` (string): Phone number
- `address` (string): User address
- `role` (string): User role ("customer" or "admin")
- `is_active` (boolean): Active status

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Updated Doe",
  "phone": "0987654321",
  "address": "456 New St, City",
  "role": "admin",
  "is_active": false,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-03T10:00:00+00:00",
  "total_orders": 5,
  "total_spent": 500000.0
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "User not found"
  }
  ```
- `403 Forbidden`:
  ```json
  {
    "detail": "Not enough permissions"
  }
  ```

---

### Delete User

**Endpoint:** `DELETE /admin/users/{user_id}`

**Description:** Soft delete a user (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `user_id` (integer, required): User ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Request:**
```
DELETE /admin/users/1
```

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "User not found"
  }
  ```
- `403 Forbidden`:
  ```json
  {
    "detail": "Not enough permissions"
  }
  ```

---

## Admin - Product Management

### Get All Products (Admin)

**Endpoint:** `GET /admin/products`

**Description:** Get all products with admin filters and pagination (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1, min: 1): Page number
- `limit` (integer, optional, default: 20, min: 1, max: 100): Items per page
- `search` (string, optional): Search term for product name
- `is_active` (boolean, optional): Filter by active status
- `low_stock` (boolean, optional, default: false): Filter low stock products

**Example Request:**
```
GET /admin/products?page=1&limit=20&search=apple&is_active=true&low_stock=true
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "product_code": "PROD001",
      "product_id": "P001",
      "title": "Fresh Apple",
      "product_name": "Organic Red Apple",
      "current_price": 50000,
      "current_price_text": "50.000đ",
      "unit": "gam",
      "original_price": 60000,
      "original_price_text": "60.000đ",
      "discount_percent": 17,
      "discount_text": "-17%",
      "product_url": "https://example.com/products/apple",
      "image_url": "https://example.com/images/apple.jpg",
      "image_alt": "Fresh Red Apple",
      "product_position": 1,
      "description": "Fresh organic red apples",
      "stock_quantity": 5,
      "is_active": true,
      "created_at": "2024-01-01T10:00:00+00:00",
      "updated_at": "2024-01-02T10:00:00+00:00",
      "average_rating": 4.5,
      "review_count": 10,
      "total_sold": 100
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3,
  "has_next": true,
  "has_prev": false
}
```

---

### Create Product

**Endpoint:** `POST /admin/products`

**Description:** Create a new product (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "product_code": "PROD002",
  "product_id": "P002",
  "title": "Fresh Banana",
  "product_name": "Organic Yellow Banana",
  "current_price": 30000,
  "current_price_text": "30.000đ",
  "unit": "gam",
  "original_price": 35000,
  "original_price_text": "35.000đ",
  "discount_percent": 14,
  "discount_text": "-14%",
  "product_url": "https://example.com/products/banana",
  "image_url": "https://example.com/images/banana.jpg",
  "image_alt": "Fresh Yellow Banana",
  "product_position": 2,
  "description": "Fresh organic yellow bananas",
  "stock_quantity": 100
}
```

**Request Schema:**
- `product_code` (string, required): Unique product code
- `product_name` (string, required): Product name
- `current_price` (integer, required): Current price in VND
- `unit` (string, optional, default: "gam"): Unit of measurement
- `stock_quantity` (integer, optional, default: 0): Stock quantity
- Other fields are optional

**Success Response (200):**
```json
{
  "id": 2,
  "product_code": "PROD002",
  "product_id": "P002",
  "title": "Fresh Banana",
  "product_name": "Organic Yellow Banana",
  "current_price": 30000,
  "current_price_text": "30.000đ",
  "unit": "gam",
  "original_price": 35000,
  "original_price_text": "35.000đ",
  "discount_percent": 14,
  "discount_text": "-14%",
  "product_url": "https://example.com/products/banana",
  "image_url": "https://example.com/images/banana.jpg",
  "image_alt": "Fresh Yellow Banana",
  "product_position": 2,
  "description": "Fresh organic yellow bananas",
  "stock_quantity": 100,
  "is_active": true,
  "created_at": "2024-01-03T10:00:00+00:00",
  "updated_at": null,
  "average_rating": null,
  "review_count": null,
  "total_sold": null
}
```

**Error Responses:**
- `400 Bad Request`:
  ```json
  {
    "detail": "Product code already exists"
  }
  ```
- `403 Forbidden`:
  ```json
  {
    "detail": "Not enough permissions"
  }
  ```

---

### Get Single Product (Admin)

**Endpoint:** `GET /admin/products/{product_id}`

**Description:** Get detailed product information with statistics (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `product_id` (integer, required): Product ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Request:**
```
GET /admin/products/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "product_code": "PROD001",
  "product_id": "P001",
  "title": "Fresh Apple",
  "product_name": "Organic Red Apple",
  "current_price": 50000,
  "current_price_text": "50.000đ",
  "unit": "gam",
  "original_price": 60000,
  "original_price_text": "60.000đ",
  "discount_percent": 17,
  "discount_text": "-17%",
  "product_url": "https://example.com/products/apple",
  "image_url": "https://example.com/images/apple.jpg",
  "image_alt": "Fresh Red Apple",
  "product_position": 1,
  "description": "Fresh organic red apples",
  "stock_quantity": 5,
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-02T10:00:00+00:00",
  "average_rating": 4.5,
  "review_count": 10,
  "total_sold": 100
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Product not found"
  }
  ```

---

### Update Product

**Endpoint:** `PUT /admin/products/{product_id}`

**Description:** Update product information (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `product_id` (integer, required): Product ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body (all fields optional):**
```json
{
  "product_name": "Updated Apple Name",
  "current_price": 55000,
  "current_price_text": "55.000đ",
  "stock_quantity": 150,
  "is_active": true,
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "product_code": "PROD001",
  "product_id": "P001",
  "title": "Fresh Apple",
  "product_name": "Updated Apple Name",
  "current_price": 55000,
  "current_price_text": "55.000đ",
  "unit": "gam",
  "original_price": 60000,
  "original_price_text": "60.000đ",
  "discount_percent": 17,
  "discount_text": "-17%",
  "product_url": "https://example.com/products/apple",
  "image_url": "https://example.com/images/apple.jpg",
  "image_alt": "Fresh Red Apple",
  "product_position": 1,
  "description": "Updated description",
  "stock_quantity": 150,
  "is_active": true,
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-04T10:00:00+00:00",
  "average_rating": 4.5,
  "review_count": 10,
  "total_sold": 100
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Product not found"
  }
  ```

---

### Delete Product

**Endpoint:** `DELETE /admin/products/{product_id}`

**Description:** Soft delete a product (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `product_id` (integer, required): Product ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Request:**
```
DELETE /admin/products/1
```

**Success Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Product not found"
  }
  ```

---

## Admin - Order Management

### Get All Orders (Admin)

**Endpoint:** `GET /admin/orders`

**Description:** Get all orders with filters and pagination (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (integer, optional, default: 1, min: 1): Page number
- `limit` (integer, optional, default: 20, min: 1, max: 100): Items per page
- `search` (string, optional): Search term for order number or user
- `status` (string, optional): Filter by order status
  - Values: "pending", "confirmed", "shipping", "delivered", "cancelled"
- `payment_status` (string, optional): Filter by payment status
  - Values: "pending", "paid", "failed", "refunded"

**Example Request:**
```
GET /admin/orders?page=1&limit=20&status=pending&payment_status=paid
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": 100,
      "user_id": 1,
      "username": "johndoe",
      "user_email": "user@example.com",
      "order_number": "ORD-20240101-001",
      "total_amount": 150000.0,
      "status": "pending",
      "payment_status": "paid",
      "shipping_address": "123 Main St, City, Country",
      "notes": "Please deliver before 5 PM",
      "created_at": "2024-01-01T10:00:00+00:00",
      "updated_at": "2024-01-01T10:00:00+00:00",
      "items": [
        {
          "id": 1,
          "product_id": 1,
          "product_name": "Organic Red Apple",
          "quantity": 2,
          "unit_price": 50000.0,
          "total_price": 100000.0
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8,
  "has_next": true,
  "has_prev": false
}
```

---

### Get Single Order (Admin)

**Endpoint:** `GET /admin/orders/{order_id}`

**Description:** Get detailed order information (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `order_id` (integer, required): Order ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Example Request:**
```
GET /admin/orders/100
```

**Success Response (200):**
```json
{
  "id": 100,
  "user_id": 1,
  "username": "johndoe",
  "user_email": "user@example.com",
  "order_number": "ORD-20240101-001",
  "total_amount": 150000.0,
  "status": "pending",
  "payment_status": "paid",
  "shipping_address": "123 Main St, City, Country",
  "notes": "Please deliver before 5 PM",
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-01T10:00:00+00:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Organic Red Apple",
      "quantity": 2,
      "unit_price": 50000.0,
      "total_price": 100000.0
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Order not found"
  }
  ```

---

### Update Order

**Endpoint:** `PUT /admin/orders/{order_id}`

**Description:** Update order status (Admin only).

**Authentication:** Required (Admin role)

**Path Parameters:**
- `order_id` (integer, required): Order ID

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body (all fields optional):**
```json
{
  "status": "shipping",
  "payment_status": "paid",
  "notes": "Order is being shipped"
}
```

**Request Schema:**
- `status` (string, optional): Order status
  - Values: "pending", "confirmed", "shipping", "delivered", "cancelled"
- `payment_status` (string, optional): Payment status
  - Values: "pending", "paid", "failed", "refunded"
- `notes` (string, optional): Additional notes

**Success Response (200):**
```json
{
  "id": 100,
  "user_id": 1,
  "username": "johndoe",
  "user_email": "user@example.com",
  "order_number": "ORD-20240101-001",
  "total_amount": 150000.0,
  "status": "shipping",
  "payment_status": "paid",
  "shipping_address": "123 Main St, City, Country",
  "notes": "Order is being shipped",
  "created_at": "2024-01-01T10:00:00+00:00",
  "updated_at": "2024-01-05T10:00:00+00:00",
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Organic Red Apple",
      "quantity": 2,
      "unit_price": 50000.0,
      "total_price": 100000.0
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`:
  ```json
  {
    "detail": "Order not found"
  }
  ```

---

## Admin - Dashboard

### Get Public Statistics

**Endpoint:** `GET /admin/dashboard/public-stats`

**Description:** Get basic dashboard statistics without authentication.

**Authentication:** Not required (Public endpoint)

**Success Response (200):**
```json
{
  "total_users": 1000,
  "total_products": 150,
  "total_orders": 5000,
  "total_revenue": 50000000.0
}
```

**Response Fields:**
- `total_users` (integer): Total number of registered users
- `total_products` (integer): Total number of active products
- `total_orders` (integer): Total number of orders (all statuses)
- `total_revenue` (float): Total revenue from paid orders (VND)

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/v1/admin/dashboard/public-stats"
```

**Use Cases:**
- Display basic statistics on public homepage
- Show business metrics without requiring login
- Quick overview for stakeholders

---

### Get Dashboard Statistics

**Endpoint:** `GET /admin/dashboard/stats`

**Description:** Get comprehensive dashboard statistics (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "total_users": 1000,
  "total_products": 150,
  "total_orders": 5000,
  "total_revenue": 50000000.0,
  "pending_orders": 25,
  "low_stock_products": 10,
  "recent_orders": [
    {
      "id": 100,
      "order_number": "ORD-20240101-001",
      "username": "johndoe",
      "total_amount": 150000.0,
      "status": "pending",
      "created_at": "2024-01-01T10:00:00+00:00"
    }
  ],
  "top_products": [
    {
      "id": 1,
      "product_name": "Organic Red Apple",
      "total_sold": 500,
      "total_revenue": 25000000.0
    }
  ],
  "monthly_revenue": [
    {
      "month": "2024-01",
      "revenue": 5000000.0,
      "orders": 500
    }
  ]
}
```

---

### Get User Statistics

**Endpoint:** `GET /admin/dashboard/user-stats`

**Description:** Get detailed user statistics (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "total_users": 1000,
  "active_users": 750,
  "new_users_this_month": 50,
  "users_by_role": {
    "customer": 980,
    "admin": 20
  }
}
```

---

### Get Product Statistics

**Endpoint:** `GET /admin/dashboard/product-stats`

**Description:** Get detailed product statistics (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "total_products": 150,
  "active_products": 140,
  "out_of_stock": 5,
  "low_stock": 10,
  "total_categories": 15
}
```

---

### Get Order Statistics

**Endpoint:** `GET /admin/dashboard/order-stats`

**Description:** Get detailed order statistics (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response (200):**
```json
{
  "total_orders": 5000,
  "pending_orders": 25,
  "completed_orders": 4500,
  "cancelled_orders": 100,
  "total_revenue": 50000000.0,
  "average_order_value": 100000.0
}
```

---

### Get Recent Activity

**Endpoint:** `GET /admin/dashboard/recent-activity`

**Description:** Get recent activity including orders, users, and reviews (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `limit` (integer, optional, default: 10, min: 1, max: 50): Number of activities to return

**Example Request:**
```
GET /admin/dashboard/recent-activity?limit=10
```

**Success Response (200):**
```json
[
  {
    "type": "order",
    "id": 100,
    "description": "New order #ORD-20240101-001 from johndoe",
    "amount": 150000.0,
    "status": "pending",
    "created_at": "2024-01-01T10:00:00+00:00"
  },
  {
    "type": "review",
    "id": 50,
    "description": "New 5-star review from johndoe",
    "rating": 5,
    "created_at": "2024-01-01T09:30:00+00:00"
  },
  {
    "type": "user",
    "id": 10,
    "description": "New user registered: johndoe",
    "email": "user@example.com",
    "created_at": "2024-01-01T09:00:00+00:00"
  }
]
```

---

### Get Sales Analytics

**Endpoint:** `GET /admin/dashboard/sales-analytics`

**Description:** Get sales analytics for a specified period (Admin only).

**Authentication:** Required (Admin role)

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `days` (integer, optional, default: 30, min: 7, max: 365): Number of days to analyze

**Example Request:**
```
GET /admin/dashboard/sales-analytics?days=30
```

**Success Response (200):**
```json
{
  "period_days": 30,
  "start_date": "2023-12-02",
  "end_date": "2024-01-01",
  "daily_sales": [
    {
      "date": "2023-12-02",
      "orders": 10,
      "revenue": 1000000.0
    },
    {
      "date": "2023-12-03",
      "orders": 15,
      "revenue": 1500000.0
    }
  ],
  "top_products": [
    {
      "id": 1,
      "product_name": "Organic Red Apple",
      "total_sold": 500,
      "total_revenue": 25000000.0
    },
    {
      "id": 2,
      "product_name": "Fresh Banana",
      "total_sold": 400,
      "total_revenue": 12000000.0
    }
  ]
}
```

---

## Error Codes

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | OK - Request succeeded |
| 400 | Bad Request - Invalid request parameters or body |
| 401 | Unauthorized - Authentication required or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

### Common Error Responses

**Authentication Error (401):**
```json
{
  "detail": "Not authenticated"
}
```

**Permission Error (403):**
```json
{
  "detail": "Not enough permissions"
}
```

**Validation Error (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**Not Found Error (404):**
```json
{
  "detail": "Resource not found"
}
```

---

## Data Models

### User Roles
- `customer` - Regular customer user
- `admin` - Administrator with full access

### Order Status
- `pending` - Order is pending confirmation
- `confirmed` - Order has been confirmed
- `shipping` - Order is being shipped
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled

### Payment Status
- `pending` - Payment is pending
- `paid` - Payment has been completed
- `failed` - Payment failed
- `refunded` - Payment has been refunded

### Field Types and Constraints

**User:**
- `email`: Valid email address, unique
- `username`: String, unique, 3-100 characters
- `password`: String, minimum 8 characters (for registration)
- `phone`: String, optional
- `address`: Text, optional
- `role`: Enum (customer, admin)
- `is_active`: Boolean

**Product:**
- `product_code`: String, unique, required
- `product_name`: String, required
- `current_price`: Integer, required (in VND)
- `unit`: String, default "gam"
- `stock_quantity`: Integer, default 0
- `is_active`: Boolean, default true
- `rating`: Float (1.0 - 5.0)

**Order:**
- `order_number`: String, unique, auto-generated
- `total_amount`: Float, calculated
- `status`: Enum (pending, confirmed, shipping, delivered, cancelled)
- `payment_status`: Enum (pending, paid, failed, refunded)
- `shipping_address`: Text, required

**Review:**
- `rating`: Integer (1-5), required
- `comment`: Text, optional
- `is_verified_purchase`: Boolean

---

## Notes

1. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters.
2. **Search**: Search functionality uses case-insensitive partial matching.
3. **Timestamps**: All timestamps are in ISO 8601 format with timezone (UTC).
4. **Currency**: All prices are in Vietnamese Dong (VND).
5. **Soft Delete**: Delete operations are soft deletes (setting `is_active` to false).
6. **Token Expiration**: Access tokens expire based on the configured expiration time.
7. **Order Numbers**: Auto-generated in format `ORD-YYYYMMDD-XXX`.
8. **Login Flexibility**: Users can login with either username or email address.
9. **Admin Development Access**: The `admin@gmail.com` account has password bypass for development/testing purposes.

### Security Considerations

**⚠️ IMPORTANT - Development Feature:**

The password bypass for `admin@gmail.com` is a **development/testing feature** and should NOT be used in production environments.

**Before deploying to production:**
1. Remove or disable the password bypass logic in `app/utils/auth.py`
2. Change admin email from `admin@gmail.com` to a real email address
3. Use a strong, secure password for all admin accounts
4. Implement rate limiting on login endpoints
5. Enable logging for all authentication attempts
6. Consider using environment variables to control bypass behavior

**Production-safe alternative:**
```python
# In config.py
allow_admin_bypass: bool = False  # Set to False in production

# In auth.py
if settings.allow_admin_bypass and user.email == "admin@gmail.com":
    return user
```

---

## Changelog

### Version 1.1.2 (2025-01-11)
- Added public statistics endpoint `/admin/dashboard/public-stats` (no auth required)
- Returns basic metrics: total users, products, orders, and revenue
- Perfect for displaying stats on homepage or public dashboards

### Version 1.1.1 (2025-01-11)
- Fixed admin pagination response schema to return typed items
- Added documentation clarifying fields returned in admin list endpoints
- No request/response breaking changes from v1.1.0

### Version 1.1.0 (2025-01-11)
- **[BREAKING]** Login API now uses `username_or_email` field instead of `email`
- Added support for login with both username and email
- Added admin password bypass for `admin@gmail.com` (development only)
- Updated login examples with curl commands
- Added security considerations section
- Improved error messages for authentication

### Version 1.0.0 (2024-01-01)
- Initial API documentation
- Authentication endpoints
- Product management
- Order management
- Review system
- Admin dashboard and management features

---

## Migration Guide

### Migrating from v1.1.0 to v1.1.1

No schema or request changes. Admin list endpoints now consistently return properly typed data (`AdminUserResponse`, `AdminProductResponse`, `AdminOrderResponse`). No client updates required unless you relied on raw dictionaries.

### Migrating from v1.0.0 to v1.1.0

**Breaking Change: Login Request Schema**

The login endpoint now requires `username_or_email` instead of `email`.

**Before (v1.0.0):**
```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**After (v1.1.0):**
```json
{
  "username_or_email": "user@example.com",
  "password": "mypassword"
}
```

**Frontend Update Required:**
```javascript
// Old code
const loginData = {
  email: userEmail,
  password: userPassword
};

// New code - works with both email and username
const loginData = {
  username_or_email: emailOrUsername,  // Can be either email or username
  password: userPassword
};
```

**Benefits of this change:**
- More flexible login options for users
- Better user experience (users can use what they remember)
- Backward compatible with email-only inputs

---

## FAQ (Frequently Asked Questions)

### Authentication

**Q: Can I still login with just email?**
A: Yes! The new `username_or_email` field accepts both username and email. Your existing email-based logins will work without changes.

**Q: What is the admin@gmail.com bypass feature?**
A: It's a development/testing feature that allows the admin@gmail.com account to login without password verification. This makes testing admin features easier during development.

**Q: Is the admin bypass secure for production?**
A: No! You MUST disable or remove this feature before deploying to production. See the [Security Considerations](#security-considerations) section for details.

**Q: How do I disable the admin bypass for production?**
A: Remove the bypass logic in `app/utils/auth.py` or use an environment variable to control it. Example:
```python
if settings.allow_admin_bypass and user.email == "admin@gmail.com":
    return user
```
Set `allow_admin_bypass=False` in production.

**Q: What happens if I try to login with a username that doesn't exist?**
A: You'll receive a 401 Unauthorized error with message "Incorrect username/email or password".

**Q: Can I create multiple admin accounts?**
A: Yes! Use the `create_admin.py` script or update user roles via the admin panel. Only admin@gmail.com has password bypass.

**Q: How long do access tokens last?**
A: Tokens expire after 30 minutes by default. This is configurable via the `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable.

### General

**Q: What format should I use for API requests?**
A: All requests should use `Content-Type: application/json` and send data as JSON in the request body.

**Q: How do I authenticate API requests?**
A: Include the JWT token in the Authorization header: `Authorization: Bearer <your_token>`

**Q: What does "soft delete" mean?**
A: Instead of permanently removing records from the database, we set `is_active=false`. This preserves data integrity and allows recovery if needed.

**Q: Are there rate limits on the API?**
A: Currently no rate limiting is implemented. Consider adding rate limiting for production deployments, especially on authentication endpoints.

---

## Example Usage

### JavaScript/TypeScript (Fetch API)

**Login Example:**
```javascript
// Login function
async function login(usernameOrEmail, password) {
  try {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password: password
      })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    // Store token for future requests
    localStorage.setItem('access_token', data.access_token);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Get user profile
async function getUserProfile() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:8000/api/v1/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  return await response.json();
}

// Usage
login('user@example.com', 'mypassword')
  .then(data => console.log('Logged in:', data))
  .catch(error => console.error('Failed:', error));
```

### Python (Requests)

**Login Example:**
```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

def login(username_or_email: str, password: str):
    """Login and return access token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username_or_email": username_or_email,
            "password": password
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return data['access_token']
    else:
        raise Exception(f"Login failed: {response.json()}")

def get_profile(token: str):
    """Get user profile"""
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.json()

# Usage
token = login("user@example.com", "mypassword")
profile = get_profile(token)
print(f"Logged in as: {profile['username']}")
```

### cURL

**Login with email:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "user@example.com",
    "password": "mypassword"
  }'
```

**Login with username:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "johndoe",
    "password": "mypassword"
  }'
```

**Get user profile:**
```bash
TOKEN="your_access_token_here"

curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Create order:**
```bash
curl -X POST "http://localhost:8000/api/v1/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": "123 Main St, City, Country",
    "notes": "Please deliver before 5 PM",
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 3, "quantity": 1}
    ]
  }'
```

### React Integration Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface LoginCredentials {
  username_or_email: string;
  password: string;
}

interface AuthToken {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) throw new Error('Login failed');

    const data: AuthToken = await response.json();
    localStorage.setItem('access_token', data.access_token);
    setToken(data.access_token);
    
    // Fetch user profile
    await fetchProfile(data.access_token);
  };

  const fetchProfile = async (authToken?: string) => {
    const tkn = authToken || token;
    if (!tkn) return;

    const response = await fetch('/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${tkn}` }
    });

    if (response.ok) {
      const userData: User = await response.json();
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return { user, token, login, logout, isAuthenticated: !!token };
};

// Usage in component
function LoginPage() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    username_or_email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Email or Username"
        value={credentials.username_or_email}
        onChange={(e) => setCredentials({
          ...credentials,
          username_or_email: e.target.value
        })}
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({
          ...credentials,
          password: e.target.value
        })}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

