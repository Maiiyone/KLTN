export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto border-t border-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌾</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                Nông Sản Xanh
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Cung cấp nông sản sạch, chất lượng cao từ các trang trại địa phương. 
              Cam kết mang đến sự tươi ngon và an toàn cho mọi gia đình.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Liên kết</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/" className="hover:text-green-400 transition-all hover:translate-x-1 inline-block">
                  → Trang chủ
                </a>
              </li>
              <li>
                <a href="/products" className="hover:text-green-400 transition-all hover:translate-x-1 inline-block">
                  → Sản phẩm
                </a>
              </li>
              <li>
                <a href="/orders" className="hover:text-green-400 transition-all hover:translate-x-1 inline-block">
                  → Đơn hàng
                </a>
              </li>
              <li>
                <a href="/reviews" className="hover:text-green-400 transition-all hover:translate-x-1 inline-block">
                  → Đánh giá
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Liên hệ</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-green-400">📧</span>
                <span>contact@nongsanxanh.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">📞</span>
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">📍</span>
                <span>123 Đường ABC, TP.HCM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2024 <span className="text-green-400 font-semibold">Nông Sản Xanh</span>. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

