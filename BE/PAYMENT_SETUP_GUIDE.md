# Payment System Setup Guide

## 📋 Tổng quan

Hướng dẫn này giúp bạn setup và test hệ thống thanh toán MoMo và VNPay.

---

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
pip install requests
```

Các dependencies khác đã có sẵn trong project (FastAPI, SQLAlchemy, etc.)

---

### 2. Create Database Tables

Chạy migration script để tạo bảng `payments`:

```bash
cd /Users/lap15538/Data/KLTN/BE
python create_tables.py
```

Script này sẽ tạo tất cả các bảng cần thiết, bao gồm bảng `payments` mới.

---

### 3. Configure Environment Variables

Tạo hoặc update file `.env`:

```bash
# Database
DATABASE_URL=mysql+pymysql://local:123456@localhost:3306/local_db

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MoMo Configuration (Test credentials)
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
# MOMO_IPN_URL sẽ được set tự động hoặc config khi deploy

# VNPay Configuration (Test credentials)
VNPAY_TMN_CODE=DEMOV210
VNPAY_HASH_SECRET=RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
# VNPAY_IPN_URL sẽ được set tự động hoặc config khi deploy

# Payment General
PAYMENT_TIMEOUT_MINUTES=15
```

**Note về Test Credentials:**
- MoMo và VNPay credentials trên là test credentials public
- Khi deploy production, bạn cần đăng ký merchant account và thay thế bằng credentials thật

---

### 4. Start Development Server

```bash
cd /Users/lap15538/Data/KLTN/BE
python app/run.py
```

Server sẽ chạy ở: `http://localhost:8000`

---

## 🧪 Testing Payment Flow

### Test với Postman hoặc cURL

#### 1. Login để lấy access token

```bash
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}

# Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### 2. Tạo order (nếu chưa có)

```bash
POST http://localhost:8000/api/v1/orders
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "shipping_address": "123 Test Street, Ho Chi Minh City",
  "notes": "Test order for payment"
}

# Response:
{
  "id": 123,
  "order_number": "ORD-20240101-001",
  "total_amount": 100000,
  "status": "pending",
  "payment_status": "pending"
}
```

#### 3. Initialize Payment

```bash
POST http://localhost:8000/api/v1/payments/init
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "order_id": 123,
  "payment_method": "momo",
  "return_url": "http://localhost:3000/payment/result",
  "cancel_url": "http://localhost:3000/payment/cancel"
}

# Response:
{
  "success": true,
  "payment_id": 456,
  "payment_url": "https://test-payment.momo.vn/...",
  "message": "Payment initialized successfully"
}
```

#### 4. Test Payment Gateway

Copy `payment_url` từ response và mở trong browser:
- Đối với MoMo test: Sử dụng số điện thoại `0963181714` và OTP `111111`
- Đối với VNPay test: Sử dụng thẻ test:
  - Card Number: `9704198526191432198`
  - Cardholder: `NGUYEN VAN A`
  - Issue Date: `07/15`
  - OTP: `123456`

5200000000001096
NGUYEN VAN A
05/26
111


---vnpay
Ngân hàng	NCB
Số thẻ	9704198526191432198
Tên chủ thẻ	NGUYEN VAN A
Ngày phát hành	07/15
Mật khẩu OTP	123456
#### 5. Check Payment Status

```bash
GET http://localhost:8000/api/v1/payments/456/status
Authorization: Bearer YOUR_ACCESS_TOKEN

# Response:
{
  "payment_id": 456,
  "order_id": 123,
  "payment_method": "momo",
  "amount": 100000,
  "status": "paid",
  "transaction_id": "MOMO123456",
  "created_at": "2024-01-01T12:00:00",
  "paid_at": "2024-01-01T12:05:00"
}
```

---

## 🌐 Setup IPN Callback với Ngrok (Local Development)

Để test IPN callback từ MoMo/VNPay về local machine, bạn cần expose local server ra internet:

### 1. Install Ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start Ngrok

```bash
ngrok http 8000
```

Ngrok sẽ cho bạn một public URL, ví dụ: `https://abc123.ngrok.io`

### 3. Update IPN URLs trong .env

```bash
MOMO_IPN_URL=https://abc123.ngrok.io/api/v1/payments/momo/callback
VNPAY_IPN_URL=https://abc123.ngrok.io/api/v1/payments/vnpay/callback
```

### 4. Restart Server

```bash
python app/run.py
```

Bây giờ MoMo/VNPay có thể gửi IPN callback về local machine của bạn!

---

## 🔍 Check Available Endpoints

### Swagger UI (Recommended)

Mở browser và truy cập:

```
http://localhost:8000/docs
```

Bạn sẽ thấy interactive API documentation với tất cả payment endpoints.

### ReDoc

```
http://localhost:8000/redoc
```

---

## 🐛 Troubleshooting

### 1. Database Connection Error

**Error:** `Can't connect to MySQL server`

**Fix:**
- Check MySQL đã chạy: `mysql -u local -p`
- Verify database tồn tại: `SHOW DATABASES;`
- Check credentials trong `.env`

### 2. Table 'payments' doesn't exist

**Fix:**
```bash
python create_tables.py
```

### 3. MoMo/VNPay signature invalid

**Fix:**
- Verify credentials trong `.env` đúng
- Check không có trailing spaces trong config
- Đảm bảo đang dùng test credentials cho sandbox environment

### 4. IPN Callback không nhận được

**Fix:**
- Check ngrok đang chạy
- Verify IPN URL trong `.env` đúng format
- Check firewall không block incoming requests
- Xem logs của ngrok: `ngrok http 8000 --log=stdout`

### 5. Payment status vẫn là 'pending'

**Possible reasons:**
- IPN callback chưa được gửi (đợi vài giây)
- IPN callback bị block (check ngrok logs)
- Signature verification failed (check logs)

**Debug:**
```bash
# Check payment logs
tail -f logs/app.log

# Check ngrok requests
# Ngrok web interface: http://localhost:4040
```

---

## 📊 Database Schema

### Payments Table

```sql
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    payment_method ENUM('momo', 'vnpay', 'cod') NOT NULL,
    amount FLOAT NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Transaction details
    transaction_id VARCHAR(255) UNIQUE,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Gateway response
    gateway_response TEXT,
    
    -- URLs
    return_url VARCHAR(500),
    cancel_url VARCHAR(500),
    
    -- Payment details
    paid_at DATETIME,
    failed_reason TEXT,
    
    -- Refund info
    refund_amount FLOAT DEFAULT 0,
    refund_reason TEXT,
    refunded_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_request_id (request_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments/init` | Initialize payment | ✅ Yes |
| GET | `/payments/{id}/status` | Get payment status | ✅ Yes |
| GET | `/payments/history` | Get payment history | ✅ Yes |
| POST | `/payments/{id}/refund` | Refund payment | ✅ Yes (Admin) |
| POST | `/payments/momo/callback` | MoMo IPN callback | ❌ No |
| GET | `/payments/vnpay/callback` | VNPay IPN callback | ❌ No |
| GET | `/payments/test/momo` | Test MoMo config | ❌ No |
| GET | `/payments/test/vnpay` | Test VNPay config | ❌ No |

---

## 🔐 Production Checklist

Trước khi deploy lên production:

- [ ] Thay test credentials bằng production credentials
- [ ] Remove test endpoints (`/test/momo`, `/test/vnpay`)
- [ ] Set proper IPN URLs trong MoMo/VNPay merchant portal
- [ ] Enable HTTPS cho tất cả endpoints
- [ ] Set up proper logging và monitoring
- [ ] Test refund flow với real money (small amount)
- [ ] Implement proper error alerting
- [ ] Set up database backups
- [ ] Review security settings (CORS, rate limiting)
- [ ] Test with real payment gateway accounts

---

## 📖 Related Documentation

- [PAYMENT_API_DOCUMENTATION.md](./PAYMENT_API_DOCUMENTATION.md) - Detailed API specs
- [FRONTEND_PAYMENT_INTEGRATION.md](./FRONTEND_PAYMENT_INTEGRATION.md) - Frontend integration guide
- [MoMo API Docs](https://developers.momo.vn/) - Official MoMo documentation
- [VNPay API Docs](https://sandbox.vnpayment.vn/apis/) - Official VNPay documentation

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check [Troubleshooting](#-troubleshooting) section
2. Check logs: `tail -f logs/app.log`
3. Check Swagger UI: `http://localhost:8000/docs`
4. Contact Backend team

---

**Version:** 1.0.0  
**Last Updated:** 2024-11-12

