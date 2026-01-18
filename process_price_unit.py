import json
import re

def extract_price_and_unit(current_price):
    """
    Tách giá và đơn vị từ current_price theo logic:
    - Đi từ phải qua trái
    - Lấy các chữ số cho đến khi gặp số > 0
    - Sau khi gặp số > 0, nếu số tiếp theo là 0 thì dừng
    - Phần còn lại là giá tiền
    
    Ví dụ:
    - 14000150 → unit = 150, price = 14000 (gặp 1>0, tiếp theo là 0)
    - 24000 → unit = 0 (không có), price = 24000
    - 26600700 → unit = 700, price = 26600 (gặp 7>0, tiếp theo là 0)
    """
    try:
        price_str = str(current_price)
        
        # Nếu số quá nhỏ, không có đơn vị
        if current_price < 1000:
            return current_price, "gam"
        
        # Đi từ phải qua trái để tìm unit
        unit_digits = []
        i = len(price_str) - 1
        found_non_zero = False
        
        # Lấy các chữ số từ phải qua trái
        while i >= 0:
            digit = int(price_str[i])
            unit_digits.insert(0, digit)  # Thêm vào đầu để giữ thứ tự
            
            # Nếu chưa gặp số > 0, tiếp tục
            if not found_non_zero:
                if digit > 0:
                    found_non_zero = True
                i -= 1
                continue
            
            # Đã gặp số > 0, kiểm tra số tiếp theo
            if i > 0:
                next_digit = int(price_str[i-1])
                if next_digit == 0:
                    # Số tiếp theo là 0, dừng lại
                    break
            else:
                # Đã đến cuối, dừng lại
                break
            i -= 1
        
        # Tạo unit từ các chữ số đã lấy
        if unit_digits and found_non_zero:
            unit_value = int(''.join(map(str, unit_digits)))
            # Phần còn lại là giá tiền
            price_value = int(price_str[:i+1]) if i >= 0 else current_price
            return price_value, f"{unit_value}g"
        else:
            return current_price, "gam"
            
    except Exception as e:
        print(f"Lỗi xử lý giá {current_price}: {e}")
        return current_price, "gam"

def process_products_data(json_file, output_file):
    """
    Xử lý dữ liệu sản phẩm để tách giá và đơn vị
    """
    try:
        # Đọc dữ liệu JSON
        with open(json_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        print(f"📊 Đang xử lý {len(products)} sản phẩm...")
        
        processed_products = []
        
        for i, product in enumerate(products, 1):
            # Lấy thông tin giá
            current_price = product.get('current_price', 0)
            
            # Tách giá và đơn vị
            price, unit = extract_price_and_unit(current_price)
            
            # Cập nhật dữ liệu
            product['current_price'] = price
            product['unit'] = unit
            
            processed_products.append(product)
            
            # Hiển thị tiến trình và ví dụ
            if i <= 10:  # Hiển thị 10 ví dụ đầu
                print(f"  {i}. {product.get('product_name', 'N/A')}")
                print(f"     Giá gốc: {current_price:,}đ → Giá: {price:,}đ, Đơn vị: {unit}")
            
            # Hiển thị tiến trình mỗi 200 sản phẩm
            if i % 200 == 0:
                print(f"  📊 Đã xử lý: {i}/{len(products)} sản phẩm")
        
        # Lưu dữ liệu đã xử lý
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_products, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Xử lý hoàn thành!")
        print(f"📁 Dữ liệu đã lưu: {output_file}")
        
        # Thống kê
        units = {}
        for product in processed_products:
            unit = product.get('unit', 'gam')
            units[unit] = units.get(unit, 0) + 1
        
        print(f"\n📈 Thống kê đơn vị:")
        for unit, count in sorted(units.items(), key=lambda x: x[1], reverse=True):
            print(f"  {unit}: {count} sản phẩm")
        
        return processed_products
        
    except Exception as e:
        print(f"❌ Lỗi xử lý dữ liệu: {e}")
        return []

if __name__ == "__main__":
    # Xử lý dữ liệu
    input_file = 'raw_total_products.json'
    output_file = 'total_products_processed_all.json'
    
    print("🚀 XỬ LÝ DỮ LIỆU GIÁ VÀ ĐƠN VỊ")
    print("=" * 50)
    print("Logic: Đi từ phải qua trái, lấy số cho đến khi gặp số > 0")
    print("Sau khi gặp số > 0, nếu số tiếp theo là 0 thì dừng")
    print("Ví dụ: 14000150 → 150g + 14000đ (gặp 1>0, tiếp theo là 0)")
    print()
    
    processed_data = process_products_data(input_file, output_file)
    
    if processed_data:
        print(f"\n🎉 Hoàn thành xử lý {len(processed_data)} sản phẩm!")
        print(f"📁 File output: {output_file}")
        print("\n💡 Bây giờ bạn có thể chạy insert_to_mysql.py với file đã xử lý!")
