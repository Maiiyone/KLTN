# Nông Sản Xanh - E-Commerce Frontend

Trang web thương mại điện tử bán nông sản sạch, được xây dựng với Next.js 14, TypeScript, và TailwindCSS.

## Tính năng

### Khách hàng
- ✅ Đăng ký và đăng nhập tài khoản
- ✅ Xem danh sách sản phẩm với tìm kiếm và phân trang
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Đặt hàng và theo dõi đơn hàng
- ✅ Đánh giá sản phẩm
- ✅ Xem lịch sử đánh giá

### Quản trị viên
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý người dùng (thêm, sửa, xóa, thay đổi vai trò)
- ✅ Quản lý sản phẩm (thêm, sửa, xóa, ẩn/hiện)
- ✅ Quản lý đơn hàng (xem chi tiết, cập nhật trạng thái)
- ✅ Xem báo cáo doanh thu và sản phẩm bán chạy

## Công nghệ sử dụng

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **State Management**: Zustand
- **Data Fetching**: Axios, SWR
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Charts**: Recharts

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd fe-ecom
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env.local` từ `.env.local.example`:
```bash
cp .env.local.example .env.local
```

4. Cập nhật URL API trong `.env.local`:
```
NEXT_PUBLIC_API_URL=http://your-api-domain.com/api/v1
```

5. Chạy development server:
```bash
npm run dev
```

6. Mở trình duyệt và truy cập `http://localhost:3000`

## Cấu trúc thư mục

```
fe-ecom/
├── app/                      # Next.js App Router pages
│   ├── admin/               # Admin pages (Dashboard, Users, Products, Orders)
│   ├── auth/                # Authentication pages (Login, Register)
│   ├── products/            # Product pages (List, Detail)
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout page
│   ├── orders/              # User orders
│   ├── reviews/             # User reviews
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── layouts/            # Layout components (MainLayout, AdminLayout)
│   ├── ui/                 # UI components (Button, Input, Card, etc.)
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Footer
│   └── ProductCard.tsx     # Product card component
├── lib/                     # Utilities and configurations
│   ├── api/                # API client functions
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── reviews.ts
│   │   └── admin.ts
│   ├── store/              # Zustand stores
│   │   ├── auth-store.ts
│   │   └── cart-store.ts
│   ├── api-client.ts       # Axios configuration
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── public/                  # Static assets
```

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint

## API Integration

Ứng dụng kết nối với backend API theo tài liệu `API_DOCUMENT.md`. Các endpoint chính:

- **Authentication**: `/auth/register`, `/auth/login`, `/auth/me`
  - Login hỗ trợ cả username và email (API v1.1.0+)
- **Products**: `/products`, `/products/{id}`
- **Orders**: `/orders`, `/orders/{id}`
- **Reviews**: `/reviews`, `/reviews/products/{id}`
- **Admin**: `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/dashboard`

### API Version
- Current: v1.1.0
- Breaking changes: Login now uses `username_or_email` instead of `email`

## Authentication

- Token được lưu trong `localStorage` với key `access_token`
- User info được lưu trong `localStorage` với key `user`
- Tự động redirect về `/auth/login` khi token hết hạn (401)
- Admin routes được bảo vệ bằng role check

## State Management

### Auth Store (Zustand)
- Quản lý trạng thái đăng nhập
- Lưu thông tin user
- Xử lý logout

### Cart Store (Zustand + Persist)
- Quản lý giỏ hàng
- Persist data vào localStorage
- Tính tổng tiền và số lượng

## Styling

- TailwindCSS 4 cho styling
- Responsive design (mobile-first)
- Dark mode ready (có thể thêm)
- Custom color palette với green theme cho nông sản

## Tính năng nổi bật

1. **Performance**: 
   - Server Components và Client Components được tách biệt hợp lý
   - Image optimization với Next.js Image
   - Code splitting tự động

2. **UX/UI**:
   - Design hiện đại, responsive
   - Loading states và error handling
   - Form validation với Zod
   - Toast notifications

3. **Security**:
   - JWT authentication
   - Protected routes
   - Role-based access control
   - Input validation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://your-api-url.com/api/v1
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and migration guides.

### Recent Updates (v1.1.0)
- ✅ Updated login to support both username and email
- ✅ Improved UI/UX with modern design
- ✅ Removed strict password validation

## Support

For support, email contact@nongsanxanh.vn or create an issue in the repository.

## Author

Developed with ❤️ for selling fresh agricultural products

---

**Note**: Đừng quên cập nhật `NEXT_PUBLIC_API_URL` trong `.env.local` trước khi chạy ứng dụng!
