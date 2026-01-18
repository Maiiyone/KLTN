#!/usr/bin/env python3
"""
Script chạy nhanh để convert JSON sang MySQL và SQL
"""

from convert_bhx_json_sql import BHXDataConverter
import os

def main():
    print("🚀 BÁCH HÓA XANH - CONVERT JSON TO MYSQL & SQL")
    print("=" * 50)
    
    # Kiểm tra file JSON
    json_file = 'total_products.json'
    if not os.path.exists(json_file):
        print(f"❌ Không tìm thấy file {json_file}")
        return
    
    # Cấu hình MySQL (có thể thay đổi ở đây)
    converter = BHXDataConverter(
        host='localhost',
        user='root',
        password='',  # Thay đổi password MySQL của bạn
        database='bhx_products'
    )
    
    try:
        # 1. Kết nối MySQL
        print("1️⃣ Kết nối MySQL...")
        if not converter.connect_mysql():
            print("❌ Không thể kết nối MySQL. Vui lòng kiểm tra:")
            print("   - MySQL đã chạy chưa?")
            print("   - Username/password đúng chưa?")
            print("   - Database có tồn tại không?")
            return
        
        # 2. Tạo database và table
        print("2️⃣ Tạo database và table...")
        if not converter.create_database_and_table():
            return
        
        # 3. Đọc JSON
        print("3️⃣ Đọc dữ liệu JSON...")
        products = converter.load_json_data(json_file)
        if not products:
            return
        
        # 4. Insert vào MySQL
        print("4️⃣ Insert vào MySQL...")
        success_count = converter.insert_data_to_mysql(products)
        
        # 5. Export SQL
        print("5️⃣ Export file SQL...")
        sql_file = 'bhx_products_backup.sql'
        converter.export_to_sql(products, sql_file)
        
        # 6. Thống kê
        print("\n" + "=" * 50)
        print("🎉 HOÀN THÀNH!")
        print(f"📊 Sản phẩm đã xử lý: {success_count}/{len(products)}")
        print(f"💾 File SQL backup: {sql_file}")
        print(f"🗄️ Database MySQL: {converter.database}")
        print(f"📁 Kích thước file SQL: {os.path.getsize(sql_file) / 1024:.1f} KB")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    finally:
        converter.close_connection()

if __name__ == "__main__":
    main()
