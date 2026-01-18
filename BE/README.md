# Bach Hoa Xanh E-commerce Backend

API backend cho trang web ecommerce Bách Hóa Xanh với các tính năng quản lý sản phẩm, đặt hàng, thanh toán và đánh giá.

## 🚀 Tính năng

- **Authentication & Authorization**: Đăng ký, đăng nhập với JWT
- **Product Management**: Hiển thị danh sách sản phẩm, tìm kiếm, chi tiết sản phẩm
- **Order Management**: Đặt hàng, quản lý đơn hàng, theo dõi trạng thái
- **Review System**: Đánh giá sản phẩm, xem review
- **User Profile**: Quản lý thông tin cá nhân
- **Admin Dashboard**: Quản lý toàn bộ hệ thống (users, products, orders, thống kê)
- **Payment Integration**: Thanh toán MoMo và VNPay

## 🤖 Chatbot Service (Đã tách biệt)

Chatbot **đã được tách thành service riêng** chạy trên port 8001 để giảm tải cho main service:

### Chạy Chatbot Riêng biệt

**Option 1: Chạy riêng biệt**
```bash
# Terminal 1: Main service (port 8000)
python app/run.py

# Terminal 2: Chatbot service (port 8001)
cd chatbot_service
./start.sh
```

**Option 2: Chạy cùng lúc (Development)**
```bash
# Chạy cả hai services cùng lúc
./run_both.sh
```

### Cấu trúc Microservices

```
┌─────────────────┐    ┌─────────────────┐
│   Main Service  │    │ Chatbot Service │
│   Port: 8000    │    │   Port: 8001    │
│                 │    │                 │
│ - Auth          │    │ - AI Chatbot    │
│ - Products      │    │ - Tools         │
│ - Orders        │    │ - Memory        │
│ - Payments      │    │                 │
│ - Reviews       │    │ Shared:         │
│ - Admin         │    │ - Database      │
└─────────────────┘    │ - Redis         │
                       └─────────────────┘
```

### API Routing

Sử dụng nginx hoặc API Gateway để route requests:

```nginx
# /api/v1/chatbot/* → http://localhost:8001
# /api/v1/* (khác) → http://localhost:8000
```

### Lợi ích

- ✅ **Load Distribution**: Chatbot requests không ảnh hưởng main service
- ✅ **Resource Isolation**: Memory, CPU riêng biệt
- ✅ **Independent Scaling**: Scale chatbot riêng
- ✅ **Separate Deployments**: Deploy/update độc lập

## 🛠️ Công nghệ sử dụng

- **FastAPI**: Web framework hiện đại và nhanh
- **MySQL**: Database chính
- **Redis**: Cache và session storage
- **SQLAlchemy**: ORM
- **JWT**: Authentication
- **MoMo/VNPay**: Payment gateways

## 📁 Cấu trúc project

```
BE/
├── app/                          # Main service (Port 8000)
│   ├── __init__.py
│   ├── main.py                   # FastAPI app chính
│   ├── run.py                    # Entry point để chạy main service
│   ├── core/                     # Core configuration
│   │   ├── __init__.py
│   │   └── config.py             # Settings và configuration
│   ├── db/                       # Database configuration
│   │   ├── __init__.py
│   │   └── database.py           # Database connection
│   ├── models/                   # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── models.py             # Database models
│   ├── schemas/                  # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── schemas.py            # Request/Response schemas
│   │   └── payment_schemas.py    # Payment schemas
│   ├── services/                 # Business logic
│   │   ├── __init__.py
│   │   ├── services.py           # Service layer
│   │   └── payment_services.py   # Payment services
│   ├── utils/                    # Utility functions
│   │   ├── __init__.py
│   │   └── auth.py               # Authentication utilities
│   └── api/                      # API routes
│       ├── __init__.py
│       └── v1/                   # API version 1
│           ├── __init__.py
│           ├── api.py            # Main API router
│           ├── auth.py           # Authentication endpoints
│           ├── products.py       # Product endpoints
│           ├── orders.py         # Order endpoints
│           ├── reviews.py        # Review endpoints
│           ├── payments.py       # Payment endpoints
│           ├── admin.py          # Admin endpoints
│           └── admin_dashboard.py # Admin dashboard
├── chatbot_service/              # 🤖 Chatbot service (Port 8001)
│   ├── main.py                   # FastAPI chatbot app
│   ├── run.py                    # Entry point chatbot service
│   ├── start.sh                  # Auto setup script
│   ├── requirements.txt          # Chatbot dependencies
│   ├── env.template              # Chatbot environment template
│   ├── .env                      # Chatbot environment (tạo từ env.template)
│   ├── README.md                 # Chatbot service docs
│   ├── core/                     # Chatbot configuration
│   ├── db/                       # Database connection
│   ├── models/                   # Shared models
│   ├── schemas/                  # Chatbot schemas
│   ├── services/                 # Shared business logic
│   └── chatbot/                  # AI chatbot logic
├── logs/                         # Log files
├── uploads/                      # File uploads
├── requirements.txt              # Main service dependencies
├── env.template                  # Main service environment template
├── .env                          # Main service environment (tạo từ env.template)
├── setup_env.sh                  # Script setup environment files
├── run_both.sh                   # Script chạy cả hai services
└── README.md                     # This file
```

## 📦 Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd BE
pip install -r requirements.txt
```

### 2. Cấu hình environment variables

```bash
# Cách 1: Sử dụng script tự động
./setup_env.sh

# Cách 2: Manual setup
# Main service: copy env.template thành .env ở root BE/
cp env.template .env

# Chatbot service: copy env.template thành .env trong chatbot_service/
cp chatbot_service/env.template chatbot_service/.env

# Chỉnh sửa các file .env với thông tin của bạn
nano .env                    # Main service
nano chatbot_service/.env    # Chatbot service
```

### 3. Cấu hình database

Cập nhật thông tin database trong file `.env`:

```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/database_name
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here-change-in-production
```

### 4. Setup database

```bash
# Chạy SQL script để tạo tables
mysql -u username -p database_name < create_table.sql
```

### 5. Tạo tài khoản Admin

```bash
# Tạo hoặc cập nhật admin user
python create_admin.py
# Hoặc sử dụng make
make create-admin

# Xem danh sách admin hiện có
python list_admins.py
# Hoặc
make list-admins
```

Script sẽ tự động:
- **Nếu chưa có admin**: Tạo admin mới với thông tin bạn nhập
- **Nếu đã có admin**: Hiển thị thông tin admin hiện tại và hỏi có muốn update không
- Khi update, để trống các trường không muốn thay đổi

### 6. Chạy server

```bash
# Cách 1: Sử dụng run.py
python app/run.py

# Cách 2: Sử dụng uvicorn trực tiếp
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Server sẽ chạy tại: `http://localhost:8000`

## 📚 API Documentation

Sau khi chạy server, truy cập:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔐 Authentication

### Đăng ký
```bash
POST /api/v1/auth/register
{
    "email": "user@example.com",
    "username": "username",
    "password": "password",
    "full_name": "Full Name",
    "phone": "0123456789",
    "address": "Address"
}
```

### Đăng nhập
```bash
POST /api/v1/auth/login
{
    "username_or_email": "user@example.com",  # Có thể dùng email hoặc username
    "password": "password"
}
```

**Lưu ý:** 
- Có thể đăng nhập bằng **username** HOẶC **email**
- Tài khoản `admin@gmail.com` có thể đăng nhập với **bất kỳ password nào** (bypass authentication cho development/testing)

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký tài khoản
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### Products
- `GET /api/v1/products` - Lấy danh sách sản phẩm
- `GET /api/v1/products/{id}` - Lấy chi tiết sản phẩm

### Orders
- `POST /api/v1/orders` - Tạo đơn hàng mới
- `GET /api/v1/orders` - Lấy danh sách đơn hàng của user
- `GET /api/v1/orders/{id}` - Lấy chi tiết đơn hàng

### Reviews
- `POST /api/v1/reviews` - Tạo review mới
- `GET /api/v1/reviews/products/{id}` - Lấy reviews của sản phẩm
- `GET /api/v1/reviews/my-reviews` - Lấy reviews của user hiện tại

### Chatbot
- `POST /api/v1/chatbot/session` - Tạo session hội thoại mới (tham số user_id tùy chọn)
- `POST /api/v1/chatbot/message` - Gửi tin nhắn cho chatbot, quản lý theo session và user id

### Public APIs

#### Thống kê công khai
- `GET /api/v1/admin/dashboard/public-stats` - Thống kê cơ bản (không cần auth)
  - Trả về: tổng số user, sản phẩm, đơn hàng, doanh thu

### Admin APIs (Yêu cầu quyền admin)

#### Dashboard & Thống kê
- `GET /api/v1/admin/dashboard/stats` - Thống kê chi tiết
- `GET /api/v1/admin/dashboard/user-stats` - Thống kê user
- `GET /api/v1/admin/dashboard/product-stats` - Thống kê sản phẩm
- `GET /api/v1/admin/dashboard/order-stats` - Thống kê đơn hàng
- `GET /api/v1/admin/dashboard/recent-activity` - Hoạt động gần đây
- `GET /api/v1/admin/dashboard/sales-analytics` - Phân tích doanh thu

#### Quản lý User
- `GET /api/v1/admin/users` - Lấy danh sách user (có filter)
- `GET /api/v1/admin/users/{id}` - Lấy chi tiết user
- `PUT /api/v1/admin/users/{id}` - Cập nhật user
- `DELETE /api/v1/admin/users/{id}` - Xóa user (soft delete)

#### Quản lý Sản phẩm
- `GET /api/v1/admin/products` - Lấy danh sách sản phẩm (có filter)
- `POST /api/v1/admin/products` - Tạo sản phẩm mới
- `GET /api/v1/admin/products/{id}` - Lấy chi tiết sản phẩm
- `PUT /api/v1/admin/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/v1/admin/products/{id}` - Xóa sản phẩm (soft delete)

#### Quản lý Đơn hàng
- `GET /api/v1/admin/orders` - Lấy danh sách đơn hàng (có filter)
- `GET /api/v1/admin/orders/{id}` - Lấy chi tiết đơn hàng
- `PUT /api/v1/admin/orders/{id}` - Cập nhật trạng thái đơn hàng

## 🗄️ Database Schema

### Users
- Thông tin người dùng, authentication

### Products  
- Thông tin sản phẩm (mở rộng từ bảng products hiện có)
- Giá, đơn vị, mô tả, số lượng tồn kho

### Orders
- Đơn hàng với trạng thái và thanh toán

### OrderItems
- Chi tiết các sản phẩm trong đơn hàng

### Reviews
- Đánh giá và bình luận sản phẩm

## 🔧 Development

### Thêm tính năng mới

1. Thêm model trong `app/models/models.py`
2. Thêm schema trong `app/schemas/schemas.py`
3. Thêm service logic trong `app/services/services.py`
4. Thêm endpoint trong `app/api/v1/`
5. Update `create_table.sql` nếu có thay đổi database schema

### Cấu trúc code

- **Models**: SQLAlchemy models cho database
- **Schemas**: Pydantic schemas cho validation
- **Services**: Business logic và database operations
- **API**: FastAPI endpoints và routing
- **Core**: Configuration và settings
- **Utils**: Utility functions (auth, helpers, etc.)

### Các lệnh Makefile hữu ích

```bash
make help           # Hiển thị tất cả lệnh có sẵn
make install        # Cài đặt dependencies
make run            # Chạy development server
make create-admin   # Tạo hoặc cập nhật admin user
make list-admins    # Xem danh sách admin
make db-reset       # Reset database (cẩn thận: xóa toàn bộ dữ liệu!)
make logs           # Xem application logs
make clean          # Xóa các file tạm
```

### Quản lý Admin

#### Tạo Admin mới
```bash
python create_admin.py
```
Script sẽ hỏi: email, username, password, full name

#### Cập nhật Admin hiện có
```bash
python create_admin.py
```
- Nếu đã có admin, script sẽ hỏi có muốn update không
- Nhập thông tin mới (để trống nếu không muốn thay đổi)
- Password có thể để trống để giữ password cũ

#### Xem danh sách Admin
```bash
python list_admins.py
```
Hiển thị tất cả admin users với thông tin chi tiết

## 🚀 Deployment

### Production settings

1. Cập nhật `.env`:
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
ENVIRONMENT=production
```

2. Cấu hình CORS cho domain cụ thể:
```env
ALLOWED_ORIGINS=https://yourdomain.com
```

3. Sử dụng reverse proxy (Nginx) và process manager (PM2, Gunicorn)

## 📝 Notes

- API sử dụng JWT cho authentication
- Tất cả endpoints cần authentication (trừ register, login)
- Database sử dụng MySQL với connection pooling
- Redis được sử dụng cho caching (có thể mở rộng)
- API có pagination cho danh sách
- Có validation đầy đủ với Pydantic
- Cấu trúc modular dễ maintain và scale