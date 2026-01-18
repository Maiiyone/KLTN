# 🤖 Bach Hoa Xanh Chatbot API Documentation

## Base URL
```
http://localhost:8001
```

## Authentication
No authentication required for current version.

---

## 📋 Endpoints

### 1. Health Check

**GET** `/health`

Kiểm tra trạng thái service.

**Response:**
```json
{
  "status": "healthy",
  "service": "chatbot",
  "port": 8001
}
```

---

### 2. Create Session

**POST** `/api/v1/chatbot/session`

Tạo session mới cho conversation.

**Request Body:**
```json
{
  "user_id": 123  // optional, integer
}
```

**Response:**
```json
{
  "session_id": "8e064a67-0a25-417c-a0f0-b56926d71357"
}
```

**Response Fields:**
- `session_id` (string, required): UUID session identifier, dùng cho các request tiếp theo

---

### 3. Send Message

**POST** `/api/v1/chatbot/message`

Gửi message đến chatbot và nhận response.

**Request Body:**
```json
{
  "session_id": "8e064a67-0a25-417c-a0f0-b56926d71357",
  "message": "Tôi muốn mua bắp mỹ",
  "user_id": 123  // optional, integer
}
```

**Request Fields:**
- `session_id` (string, required): Session ID từ endpoint create_session
- `message` (string, required): Nội dung message của user
- `user_id` (integer, optional): User ID để personalize response (orders, profile)

**Response:**
```json
{
  "reply": "Tôi tìm thấy các sản phẩm bắp Mỹ phù hợp với yêu cầu của bạn...",
  "session_id": "8e064a67-0a25-417c-a0f0-b56926d71357",
  "context": {
    "products": [...],  // khi intent là product_search
    "orders": [...],    // khi intent là orders
    "profile": {...}    // khi intent là profile
  }
}
```

**Response Fields:**
- `reply` (string, required): Câu trả lời từ chatbot (tiếng Việt khi có AI, tiếng Anh khi fallback)
- `session_id` (string, required): Session ID (giống request)
- `context` (object, required): Dữ liệu từ tools, format khác nhau tùy intent

---

## 📦 Context Format Details

### Context khi Intent = `product_search`

**Khi dùng Qdrant RAG (có đầy đủ thông tin):**
```json
{
  "context": {
    "products": [
      {
        "product_id": "200360",
        "product_code": "9932979000041",
        "product_name": "Nấm mèo đen thái sợi 50g",
        "price": 16000.0,
        "price_text": "16.000đ/Gói 50g",
        "unit": "50g",
        "product_url": "/dau-cac-loai/nam-meo-den-thai-soi-naita-goi-50g",
        "image_url": "https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/3235/200360/bhx/200360_202411171024584771.jpg",
        "discount_percent": null,
        "score": 0.85
      }
    ]
  }
}
```

**Khi dùng SQL fallback (thông tin cơ bản):**
```json
{
  "context": {
    "products": [
      {
        "product_id": null,
        "product_code": null,
        "product_name": "Bắp Mỹ tươi",
        "price": 25000.0,
        "price_text": null,
        "unit": null,
        "product_url": null,
        "image_url": null,
        "discount_percent": 10,
        "score": null
      }
    ]
  }
}
```

**Product Fields:**
- `product_id` (string | null): Product ID từ Qdrant (chỉ có khi dùng RAG)
- `product_code` (string | null): Mã sản phẩm/barcode
- `product_name` (string, required): Tên sản phẩm
- `price` (float, required): Giá hiện tại (VND)
- `price_text` (string | null): Giá đã format (VD: "16.000đ/Gói 50g")
- `unit` (string | null): Đơn vị (VD: "50g", "gam")
- `product_url` (string | null): URL trang chi tiết sản phẩm
- `image_url` (string | null): URL hình ảnh sản phẩm
- `discount_percent` (integer | null): Phần trăm giảm giá (0-100)
- `score` (float | null): Độ tương đồng semantic (0-1), chỉ có khi dùng Qdrant RAG

**Lưu ý:**
- Mảng `products` có thể rỗng `[]` nếu không tìm thấy sản phẩm
- Tối đa 5 sản phẩm được trả về
- Khi dùng Qdrant RAG, sản phẩm được sắp xếp theo `score` (cao → thấp)
- Khi dùng SQL, sản phẩm được sắp xếp theo `created_at` (mới → cũ)

---

### Context khi Intent = `orders`

```json
{
  "context": {
    "orders": [
      {
        "order_number": "ORD-2024-001",
        "status": "delivered",
        "total_amount": 150000.0
      },
      {
        "order_number": "ORD-2024-002",
        "status": "shipping",
        "total_amount": 200000.0
      }
    ]
  }
}
```

**Order Fields:**
- `order_number` (string, required): Mã đơn hàng
- `status` (string, required): Trạng thái đơn hàng
  - `"pending"`: Chờ xác nhận
  - `"confirmed"`: Đã xác nhận
  - `"shipping"`: Đang giao hàng
  - `"delivered"`: Đã giao hàng
  - `"cancelled"`: Đã hủy
- `total_amount` (float, required): Tổng tiền đơn hàng (VND)

**Lưu ý:**
- Mảng `orders` có thể rỗng `[]` nếu user chưa có đơn hàng
- Tối đa 5 đơn hàng gần nhất được trả về
- Chỉ trả về khi `user_id` được cung cấp trong request

---

### Context khi Intent = `profile`

```json
{
  "context": {
    "profile": {
      "full_name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0123456789"
    }
  }
}
```

**Profile Fields:**
- `full_name` (string | null): Họ và tên
- `email` (string | null): Email
- `phone` (string | null): Số điện thoại

**Lưu ý:**
- `profile` có thể là `null` nếu không tìm thấy user
- Chỉ trả về khi `user_id` được cung cấp trong request

---

## 🔄 Flow Example

### Example 1: Tìm kiếm sản phẩm

**Step 1: Tạo session**
```bash
POST /api/v1/chatbot/session
{
  "user_id": 123
}
```
Response: `{"session_id": "abc-123"}`

**Step 2: Gửi message**
```bash
POST /api/v1/chatbot/message
{
  "session_id": "abc-123",
  "message": "Tôi muốn mua bắp mỹ trong khoảng 20k-30k",
  "user_id": 123
}
```

**Response:**
```json
{
  "reply": "Tôi tìm thấy các sản phẩm bắp Mỹ trong khoảng giá bạn yêu cầu...",
  "session_id": "abc-123",
  "context": {
    "products": [
      {
        "product_name": "Bắp Mỹ tươi",
        "price": 25000.0,
        "price_text": "25.000đ/Bắp",
        "unit": "bắp",
        "score": 0.92
      }
    ]
  }
}
```

### Example 2: Xem lịch sử đơn hàng

```bash
POST /api/v1/chatbot/message
{
  "session_id": "abc-123",
  "message": "Cho tôi xem đơn hàng gần đây",
  "user_id": 123
}
```

**Response:**
```json
{
  "reply": "Here are a few of your latest orders.",
  "session_id": "abc-123",
  "context": {
    "orders": [
      {
        "order_number": "ORD-2024-001",
        "status": "delivered",
        "total_amount": 150000.0
      }
    ]
  }
}
```

---

## ⚠️ Error Responses

### 500 Internal Server Error
```json
{
  "detail": "Chatbot is unavailable"
}
```

Xảy ra khi:
- Database connection failed
- Qdrant connection failed
- LangGraph execution error

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "session_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

Xảy ra khi request body thiếu required fields hoặc sai format.

---

## 📝 Notes for Frontend Team

1. **Session Management:**
   - Mỗi conversation cần 1 session_id duy nhất
   - Session được tạo 1 lần, dùng cho toàn bộ conversation
   - Có thể tạo session mới khi user bắt đầu conversation mới

2. **Context Handling:**
   - Luôn check `context.products`, `context.orders`, `context.profile` có thể là `null` hoặc mảng rỗng
   - Khi `products` có `score`, đó là kết quả từ Qdrant RAG (có đầy đủ thông tin)
   - Khi `products` không có `score`, đó là kết quả từ SQL fallback (thông tin cơ bản)

3. **Product Display:**
   - Ưu tiên dùng `image_url` và `product_url` khi có
   - Format giá: dùng `price_text` nếu có, không thì format từ `price`
   - Hiển thị `score` (nếu có) để user biết độ liên quan

4. **Error Handling:**
   - Luôn handle case `context.products = []` (không tìm thấy sản phẩm)
   - Handle case `context.profile = null` (user không tồn tại)
   - Retry logic cho 500 errors

5. **User ID:**
   - Cung cấp `user_id` để có personalized responses (orders, profile)
   - Không bắt buộc cho product search

---

## 🔗 CORS

API cho phép requests từ:
- `http://localhost:3000`

Nếu cần thêm origin, cập nhật trong `main.py`.

