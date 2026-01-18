# System Design Notes

## Sequence Diagrams

### 1. Thanh toán 
```mermaid
sequenceDiagram
    participant User
    participant PaymentsAPI as Payments API
    participant PaymentService
    participant Gateway as Payment Gateway
    participant OrderService

    User->>PaymentsAPI: POST /payments/init
    PaymentsAPI->>PaymentService: create_payment(userId, orderId, method)
    PaymentService->>OrderService: validateOrderTotal()
    PaymentService-->>PaymentsAPI: {payment_id, payment_url}
    PaymentsAPI-->>User: payment link / QR
    User->>Gateway: Complete payment session
    Gateway-->>User: redirect to return_url
    Gateway->>PaymentsAPI: IPN callback (MoMo/VNPay)
    PaymentsAPI->>PaymentService: handle_callback(payload)
    PaymentService->>OrderService: markPaid(orderId)
    PaymentService-->>PaymentsAPI: update status
    PaymentsAPI-->>Gateway: 200 OK
    User->>PaymentsAPI: GET /payments/{id}/status
    PaymentsAPI->>PaymentService: get_payment_status(id)
    PaymentService-->>PaymentsAPI: status payload
    PaymentsAPI-->>User: pending/paid/failed
```


### 2. Review sanr phẩm
```mermaid
sequenceDiagram
    participant User
    participant AuthGuard as Auth Guard
    participant ReviewsAPI as Reviews API
    participant ReviewService
    participant DB

    User->>AuthGuard: Bearer token
    AuthGuard-->>User: authorized userId
    User->>ReviewsAPI: POST /reviews (rating, comment, product_id)
    ReviewsAPI->>ReviewService: create_review(userId, payload)
    ReviewService->>DB: insert review
    DB-->>ReviewService: review entity
    ReviewService-->>ReviewsAPI: reviewId
    ReviewsAPI-->>User: success message
    User->>ReviewsAPI: GET /reviews/products/{productId}
    ReviewsAPI->>ReviewService: get_product_reviews(productId, page)
    ReviewService->>DB: query aggregated ratings
    DB-->>ReviewService: review list
    ReviewService-->>ReviewsAPI: {reviews, total}
    ReviewsAPI-->>User: paginated reviews
```

### 3. Admin update thông tin order
```mermaid
sequenceDiagram
    participant Admin
    participant AdminAuth as Admin Auth
    participant AdminAPI as Admin Orders API
    participant AdminOrderService
    participant DB

    Admin->>AdminAPI: PUT /admin/orders/{orderId}
    AdminAPI->>AdminAuth: ensure role == admin
    AdminAuth-->>AdminAPI: admin context
    AdminAPI->>AdminOrderService: update_order(orderId, status, payment)
    AdminOrderService->>DB: fetch order + items
    AdminOrderService->>DB: update status / tracking
    DB-->>AdminOrderService: updated order
    AdminOrderService-->>AdminAPI: order dto
    AdminAPI-->>Admin: updated order response
```

## Activity Diagrams

### A1. Quy trình tạo đơn & thanh toán
```mermaid
flowchart TD
    A[Bắt đầu] --> B[Người dùng đăng nhập]
    B --> C[Duyệt sản phẩm]
    C --> D[Thêm vào giỏ]
    D --> E{Tiếp tục mua?}
    E -- Có --> C
    E -- Không --> F[Xác nhận giỏ]
    F --> G[Chọn phương thức thanh toán]
    G --> H[POST /orders]
    H --> I{Tồn kho đủ?}
    I -- Không --> I1[Thông báo lỗi] --> C
    I -- Có --> J[Tạo Order + Items]
    J --> K{Thanh toán online?}
    K -- COD --> L[Gắn trạng thái pending]
    K -- MoMo/VNPay --> M[Khởi tạo payment]
    M --> N[Chờ callback/IPN]
    N --> O{Gateway thành công?}
    O -- Không --> O1[Mark failed, báo người dùng] --> C
    O -- Có --> P[Mark paid + giảm tồn]
    L --> P
    O1 --> R
    P --> R[Kết thúc]
```

## 4. Flow tạo order

```mermaid
sequenceDiagram
    actor User
    participant API as API Endpoint
    participant OrderService
    participant ProductService
    participant DB as Database

    User->>API: POST /orders (items, shipping_info)
    API->>OrderService: create_order(user_id, order_data)
    
    OrderService->>DB: Query User
    DB-->>OrderService: User found
    
    loop For each item
        OrderService->>DB: Query Product
        DB-->>OrderService: Product details
        
        alt Product not found
            OrderService-->>API: Error: Product not found
            API-->>User: 404 Not Found
        else Insufficient stock
            OrderService-->>API: Error: Insufficient stock
            API-->>User: 400 Bad Request
        end
        
        OrderService->>OrderService: Calculate item total
    end
    
    OrderService->>OrderService: Calculate total amount
    OrderService->>DB: Create Order record
    
    loop For each item
        OrderService->>DB: Create OrderItem record
        OrderService->>DB: Update Product stock
    end
    
    OrderService->>DB: Commit transaction
    DB-->>OrderService: Success
    
    OrderService-->>API: Return Order object
    API-->>User: 200 OK (Order details)
```

## Chatbot Service Sequence Diagrams

### C1. Khởi tạo phiên trò chuyện
```mermaid
sequenceDiagram
    participant Client
    participant ChatbotAPI as Chatbot API (/api/v1/chatbot/session)
    participant ChatbotService
    participant Redis as RedisChatMemory

    Client->>ChatbotAPI: POST /session (user_id?)
    ChatbotAPI->>ChatbotService: create_session(user_id)
    ChatbotService->>Redis: create_session -> lưu history/meta
    Redis-->>ChatbotService: session_id + TTL
    ChatbotService-->>ChatbotAPI: {session_id, user_id, expires_in}
    ChatbotAPI-->>Client: 200 OK (session info)
```

### C2. Xử lý tin nhắn và gọi tool
```mermaid
sequenceDiagram
    participant Client
    participant ChatbotAPI as Chatbot API (/api/v1/chatbot/message)
    participant ChatbotService
    participant Memory as RedisChatMemory
    participant Graph as LangGraph Agent
    participant Tools as ToolNode
    participant DB as MySQL/Services

    Client->>ChatbotAPI: POST /message (session_id, text, user_id)
    ChatbotAPI->>ChatbotService: process_message(...)
    ChatbotService->>Memory: get_session(session_id)
    Memory-->>ChatbotService: history + user_id
    ChatbotService->>Graph: messages (system + history + user)
    Graph-->>ChatbotService: AIMessage with tool_calls?
    alt Có tool_calls
        ChatbotService->>Tools: invoke(tool_args)
        Tools->>DB: truy vấn / gọi service (Product, Order,...)
        DB-->>Tools: dữ liệu
        Tools-->>ChatbotService: ToolMessage (JSON)
        ChatbotService->>Graph: append ToolMessage, tiếp tục
        Graph-->>ChatbotService: AIMessage final
    else Không cần tool
        Graph-->>ChatbotService: AIMessage final
    end
    ChatbotService->>Memory: save_history(session_id, history+reply)
    ChatbotService-->>ChatbotAPI: {reply, sources}
    ChatbotAPI-->>Client: 200 OK
```

### C3. Chatbot khởi tạo thanh toán đơn hàng
```mermaid
sequenceDiagram
    participant User
    participant ChatbotAPI
    participant ChatbotService
    participant Graph
    participant Tools
    participant PaymentSvc as PaymentService (chatbot_service/services/payment_services.py)
    participant Orders as OrderService

    User->>ChatbotAPI: "Tôi muốn thanh toán đơn 123"
    ChatbotAPI->>ChatbotService: process_message(session, text, user_id)
    ChatbotService->>Graph: build context & invoke
    Graph-->>ChatbotService: AIMessage yêu cầu tool initiate_payment
    ChatbotService->>Tools: initiate_payment(user_id, order_id, method, return_url)
    Tools->>Orders: validate quyền sở hữu đơn
    Orders-->>Tools: order hợp lệ
    Tools->>PaymentSvc: create_payment(...)
    PaymentSvc-->>Tools: {success, payment_url}
    Tools-->>ChatbotService: ToolMessage (JSON)
    ChatbotService->>Graph: append tool result để LLM tóm tắt
    Graph-->>ChatbotService: trả lời cuối cùng (link thanh toán)
    ChatbotService-->>ChatbotAPI: reply + sources
    ChatbotAPI-->>User: hướng dẫn thanh toán + URL
```
