from bs4 import BeautifulSoup
import json
import csv
from urllib.parse import urljoin
import re
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class WebScraper:
    def __init__(self, base_url=""):
        self.base_url = base_url
    
    def extract_product_info(self, product_div):
        """
        Trích xuất thông tin sản phẩm từ thẻ div
        """
        try:
            # Tìm các thông tin cần thiết
            product_data = {}
            
            # Lấy product code từ attribute product-code
            product_code = product_div.get('product-code', '')
            if not product_code:
                # Tìm trong div con nếu không có ở div cha
                product_code_div = product_div.find('div', attrs={'product-code': True})
                if product_code_div:
                    product_code = product_code_div.get('product-code', '')
            product_data['product_code'] = product_code
            
            # Lấy link sản phẩm
            link_elem = product_div.find('a', href=True)
            if link_elem:
                product_data['product_url'] = urljoin(self.base_url, link_elem['href'])
                product_data['product_id'] = link_elem.get('id', '').replace('product_', '')
                product_data['title'] = link_elem.get('title', '')
            
            # Lấy tên sản phẩm
            name_elem = product_div.find('h3', class_='product_name')
            if name_elem:
                product_data['product_name'] = name_elem.get_text(strip=True)
            
            # Lấy giá hiện tại
            price_elem = product_div.find('div', class_='product_price')
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # Loại bỏ ký tự đ và chuyển thành số
                price_value = re.sub(r'[^\d]', '', price_text)
                product_data['current_price'] = int(price_value) if price_value else 0
                product_data['current_price_text'] = price_text
            
            # Lấy giá gốc và phần trăm giảm giá
            old_price_elem = product_div.find('span', class_='line-through')
            if old_price_elem:
                old_price_text = old_price_elem.get_text(strip=True)
                old_price_value = re.sub(r'[^\d]', '', old_price_text)
                product_data['original_price'] = int(old_price_value) if old_price_value else 0
                product_data['original_price_text'] = old_price_text
            
            # Lấy phần trăm giảm giá
            discount_elem = product_div.find('span', class_='bg-[#FF0101]/[70%]')
            if discount_elem:
                discount_text = discount_elem.get_text(strip=True)
                discount_value = re.sub(r'[^\d]', '', discount_text)
                product_data['discount_percent'] = int(discount_value) if discount_value else 0
                product_data['discount_text'] = discount_text
            
            # Lấy hình ảnh sản phẩm
            img_elem = product_div.find('img')
            if img_elem:
                product_data['image_url'] = img_elem.get('src', '')
                product_data['image_alt'] = img_elem.get('alt', '')
            
            return product_data
            
        except Exception as e:
            print(f"Lỗi khi trích xuất thông tin sản phẩm: {e}")
            return {}
    
    def scroll_to_bottom(self, driver, pause_time=5):
        """
        Cuộn xuống cuối trang từ từ để load thêm sản phẩm
        """
        try:
            # Lấy chiều cao ban đầu của trang
            last_height = driver.execute_script("return document.body.scrollHeight")
            scroll_count = 0
            
            print("Bắt đầu cuộn xuống cuối trang từ từ...")
            
            while True:
                scroll_count += 1
                print(f"  Cuộn lần {scroll_count}...")
                
                # Cuộn từ từ xuống dưới (cuộn 1/3 trang mỗi lần)
                current_scroll = driver.execute_script("return window.pageYOffset;")
                scroll_step = driver.execute_script("return window.innerHeight;") // 3
                new_scroll = current_scroll + scroll_step
                
                driver.execute_script(f"window.scrollTo(0, {new_scroll});")
                
                # Đợi lâu hơn để trang load thêm nội dung
                print(f"    Đợi {pause_time} giây để load...")
                time.sleep(pause_time)
                
                # Tính chiều cao mới của trang
                new_height = driver.execute_script("return document.body.scrollHeight")
                
                # Nếu chiều cao không thay đổi, có thể đã cuộn hết
                if new_height == last_height:
                    print("  Không còn nội dung mới để load")
                    break
                
                last_height = new_height
                
                # Giới hạn số lần cuộn để tránh vòng lặp vô hạn
                if scroll_count >= 15:
                    print("  Đã cuộn đủ 15 lần, dừng lại")
                    break
            
            # Cuộn xuống cuối cùng để đảm bảo load hết
            print("  Cuộn xuống cuối cùng...")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            
            print(f"Hoàn thành cuộn trang sau {scroll_count} lần")
            
        except Exception as e:
            print(f"Lỗi khi cuộn trang: {e}")
    
    
    def scrape_products(self, html_content):
        """
        Cào data từ HTML content bằng cách tìm trực tiếp các thẻ div có class this-item
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        products = []
        
        # Tìm tất cả các thẻ div có class chứa "this-item"
        product_divs = soup.find_all('div', class_=lambda x: x and 'this-item' in x)
        print(f"Tìm thấy {len(product_divs)} sản phẩm trong HTML")
        
        # Xử lý từng sản phẩm
        for i, div in enumerate(product_divs, 1):
            print(f"Đang xử lý sản phẩm {i}...")
            
            product_info = self.extract_product_info(div)
            if product_info:
                # Thêm thông tin về vị trí sản phẩm
                product_info['product_position'] = i
                products.append(product_info)
                print(f"  ✓ Đã trích xuất: {product_info.get('product_name', 'N/A')}")
            else:
                print(f"  ✗ Không thể trích xuất sản phẩm {i}")
        
        print(f"Tổng cộng tìm thấy {len(products)} sản phẩm")
        return products
    
    
    
    def scrape_from_url(self, url, base_xpath="/html/body/div[1]/div/div[2]/div/main/div[1]/div[7]"):
        """
        Cào data sử dụng Selenium với xpath loop qua các div con
        """
        try:
            # Cấu hình Chrome options
            chrome_options = Options()
            # chrome_options.add_argument("--headless")  # Mở browser để xem
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            
            # Khởi tạo driver
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            
            # Đợi 30 giây để trang load hoàn toàn
            print("Đang đợi 30 giây để trang web load hoàn toàn...")
            time.sleep(30)
            print("Đã load xong, bắt đầu cuộn xuống cuối trang...")
            
            # Cuộn xuống cuối trang để load thêm sản phẩm
            self.scroll_to_bottom(driver)
            print("Đã cuộn xong, bắt đầu cào data...")
            
            # Đợi trang load
            wait = WebDriverWait(driver, 10)
            
            # Tìm element theo base xpath
            target_element = wait.until(EC.presence_of_element_located((By.XPATH, base_xpath)))
            
            # Lấy HTML content của target element
            html_content = target_element.get_attribute('outerHTML')
            
            # Đóng driver
            driver.quit()
            
            # Cào data từ HTML content sử dụng phương thức loop
            return self.scrape_products(html_content)
            
        except Exception as e:
            print(f"Lỗi khi cào data với Selenium loop: {e}")
            return []
    
    def save_to_json(self, data, filename):
        """
        Lưu data vào file JSON
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Đã lưu {len(data)} sản phẩm vào {filename}")
    
    def save_to_csv(self, data, filename):
        """
        Lưu data vào file CSV
        """
        if not data:
            print("Không có data để lưu")
            return
        
        fieldnames = data[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"Đã lưu {len(data)} sản phẩm vào {filename}")

def main():
    scraper = WebScraper()
    products = []
    links = [
        "https://www.bachhoaxanh.com/cu",
        "https://www.bachhoaxanh.com/rau-sach",
        "https://www.bachhoaxanh.com/nam-tuoi",
        "https://www.bachhoaxanh.com/trai-cay-tuoi-ngon"
    ]
    for link in links:
        products.extend(scraper.scrape_from_url(link))
    
    # In kết quả
    print("=== KẾT QUẢ CÀO DATA ===")
    for i, product in enumerate(products, 1):
        print(f"\nSản phẩm {i}:")
        print(f"  - Mã sản phẩm: {product.get('product_code', 'N/A')}")
        print(f"  - Tên: {product.get('product_name', 'N/A')}")
        print(f"  - Giá hiện tại: {product.get('current_price_text', 'N/A')}")
        print(f"  - Giá gốc: {product.get('original_price_text', 'N/A')}")
        print(f"  - Giảm giá: {product.get('discount_text', 'N/A')}")
        print(f"  - Link: {product.get('product_url', 'N/A')}")
        print(f"  - Hình ảnh: {product.get('image_url', 'N/A')}")
    
    # Lưu vào file
    if products:
        scraper.save_to_json(products, 'total_products.json')
        scraper.save_to_csv(products, 'total_products.csv')
    
    
if __name__ == "__main__":
    main()
