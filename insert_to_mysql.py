import json
import mysql.connector
from mysql.connector import Error

class BHXDataInserter:
    def __init__(self, host='localhost', user='local', password='123456', database='bhx_products'):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
        
    def connect_mysql(self):
        """Kết nối đến MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            if self.connection.is_connected():
                print(f"✅ Kết nối thành công đến MySQL database: {self.database}")
                return True
        except Error as e:
            print(f"❌ Lỗi kết nối MySQL: {e}")
            return False
    
    def load_json_data(self, json_file):
        """Đọc dữ liệu từ file JSON"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"✅ Đọc thành công {len(data)} sản phẩm từ {json_file}")
            return data
        except Exception as e:
            print(f"❌ Lỗi đọc file JSON: {e}")
            return []
    
    def insert_data_to_mysql(self, products):
        """Insert dữ liệu vào MySQL"""
        try:
            cursor = self.connection.cursor()
            
            # Xóa dữ liệu cũ
            cursor.execute("DELETE FROM products")
            print("🗑️ Đã xóa dữ liệu cũ")
            
            # Insert dữ liệu mới
            insert_query = """
            INSERT INTO products (
                product_code, product_id, title, product_name, 
                current_price, current_price_text, unit, original_price, original_price_text,
                discount_percent, discount_text, product_url, image_url, image_alt, product_position
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            success_count = 0
            error_count = 0
            
            for i, product in enumerate(products, 1):
                try:
                    cursor.execute(insert_query, (
                        product.get('product_code', ''),
                        product.get('product_id', ''),
                        product.get('title', ''),
                        product.get('product_name', ''),
                        product.get('current_price', 0),
                        product.get('current_price_text', ''),
                        product.get('unit', 'gam'),
                        product.get('original_price', 0),
                        product.get('original_price_text', ''),
                        product.get('discount_percent', 0),
                        product.get('discount_text', ''),
                        product.get('product_url', ''),
                        product.get('image_url', ''),
                        product.get('image_alt', ''),
                        product.get('product_position', 0)
                    ))
                    success_count += 1
                    
                    # Hiển thị tiến trình mỗi 100 sản phẩm
                    if i % 100 == 0:
                        print(f"📊 Đã xử lý: {i}/{len(products)} sản phẩm")
                        
                except Error as e:
                    error_count += 1
                    print(f"⚠️ Lỗi insert sản phẩm {i} ({product.get('product_code', 'N/A')}): {e}")
                    continue
            
            self.connection.commit()
            print(f"\n✅ Insert hoàn thành!")
            print(f"📊 Thành công: {success_count} sản phẩm")
            print(f"❌ Lỗi: {error_count} sản phẩm")
            print(f"📈 Tỷ lệ thành công: {success_count/len(products)*100:.1f}%")
            
            cursor.close()
            return success_count
            
        except Error as e:
            print(f"❌ Lỗi insert data: {e}")
            return 0
    
    def close_connection(self):
        """Đóng kết nối MySQL"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ Đã đóng kết nối MySQL")

def main():
    print("🚀 BÁCH HÓA XANH - INSERT JSON TO MYSQL")
    print("=" * 50)
    
    # Cấu hình MySQL (thay đổi password của bạn)
    inserter = BHXDataInserter(
        host='localhost',
        user='local',
        password='123456',  # ⚠️ THAY ĐỔI PASSWORD MYSQL CỦA BẠN
        database='bhx_products'
    )
    
    # File JSON input (sử dụng file đã xử lý)
    json_file = 'total_products_processed_all.json'
    
    try:
        # 1. Kết nối MySQL
        print("1️⃣ Kết nối MySQL...")
        if not inserter.connect_mysql():
            print("❌ Không thể kết nối MySQL. Vui lòng kiểm tra:")
            print("   - MySQL đã chạy chưa?")
            print("   - Username/password đúng chưa?")
            print("   - Database 'local_db' đã tạo chưa?")
            print("   - Chạy file create_table.sql trước!")
            return
        
        # 2. Đọc JSON
        print("2️⃣ Đọc dữ liệu JSON...")
        products = inserter.load_json_data(json_file)
        if not products:
            return
        
        # 3. Insert vào MySQL
        print("3️⃣ Insert vào MySQL...")
        success_count = inserter.insert_data_to_mysql(products)
        
        # 4. Thống kê
        print("\n" + "=" * 50)
        print("🎉 HOÀN THÀNH!")
        print(f"📊 Sản phẩm đã insert: {success_count}")
        print(f"🗄️ Database: {inserter.database}")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    finally:
        inserter.close_connection()

if __name__ == "__main__":
    main()
