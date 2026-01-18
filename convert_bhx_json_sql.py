import json
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime

class BHXDataConverter:
    def __init__(self, host='localhost', user='root', password='', database='bhx_products'):
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
                current_price, current_price_text, original_price, original_price_text,
                discount_percent, discount_text, product_url, image_url, image_alt, product_position
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """
            
            success_count = 0
            for product in products:
                try:
                    cursor.execute(insert_query, (
                        product.get('product_code', ''),
                        product.get('product_id', ''),
                        product.get('title', ''),
                        product.get('product_name', ''),
                        product.get('current_price', 0),
                        product.get('current_price_text', ''),
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
                except Error as e:
                    print(f"⚠️ Lỗi insert sản phẩm {product.get('product_code', 'N/A')}: {e}")
                    continue
            
            self.connection.commit()
            print(f"✅ Insert thành công {success_count}/{len(products)} sản phẩm vào MySQL")
            
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
    # Cấu hình MySQL (thay đổi theo máy của bạn)
    converter = BHXDataConverter(
        host='localhost',
        user='local',
        password='123456',
        database='bhx_products'
    )
    
    # File JSON input
    json_file = 'total_products.json'
    sql_file = 'bhx_products_backup.sql'
    
    print("🚀 Bắt đầu convert JSON sang MySQL và SQL...")
    
    # 1. Kết nối MySQL
    if not converter.connect_mysql():
        print("❌ Không thể kết nối MySQL. Vui lòng kiểm tra cấu hình.")
        return
    
    
    # 3. Đọc dữ liệu JSON
    products = converter.load_json_data(json_file)
    if not products:
        print("❌ Không có dữ liệu để xử lý.")
        converter.close_connection()
        return
    
    # 4. Insert vào MySQL
    success_count = converter.insert_data_to_mysql(products)
    
    print(f"\n🎉 Hoàn thành!")
    print(f"📊 Đã xử lý: {success_count} sản phẩm")
    print(f"🗄️ Database MySQL: {converter.database}")

if __name__ == "__main__":
    main()
