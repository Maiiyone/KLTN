import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta, timezone

# ================= CẤU HÌNH (KEY VÀ CODE MỚI CỦA BẠN) =================
VNP_HASH_SECRET = "IN6NF16ZLE940A8NN942B9Q5L0R6XN0Y" 
VNP_TMN_CODE = "KPQEMC9Q"       
# ======================================================================

class vnpay_clone_nodejs:
    requestData = {}

    def get_payment_url(self, vnpay_payment_url, secret_key):
        inputData = sorted(self.requestData.items())
        queryString = ''
        seq = 0
        for key, val in inputData:
            if seq == 1:
                queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                queryString = key + '=' + urllib.parse.quote_plus(str(val))

        hashValue = self.__hmacsha512(secret_key, queryString)
        return vnpay_payment_url + "?" + queryString + '&vnp_SecureHash=' + hashValue

    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()

if __name__ == "__main__":
    vnp = vnpay_clone_nodejs()
    
    # 1. TIMEZONE (Giống Node.js: 'Asia/Ho_Chi_Minh')
    VN_TZ = timezone(timedelta(hours=7))
    now = datetime.now(VN_TZ)
    
    # 2. MÃ ĐƠN HÀNG (Giống Node.js: DDHHmmss - Ví dụ: 28173015)
    # Node dùng moment(date).format('DDHHmmss')
    unique_txn_ref = now.strftime('%d%H%M%S')

    # 3. NGÀY TẠO (Giống Node.js: YYYYMMDDHHmmss)
    create_date = now.strftime('%Y%m%d%H%M%S')

    vnp.requestData = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": VNP_TMN_CODE,
        "vnp_Amount": "1000000",       # 10,000 VND * 100 (Giống logic Node Amount * 100)
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": unique_txn_ref,
        "vnp_OrderInfo": "Thanh toan don hang test",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        
       
        "vnp_ReturnUrl": "http://localhost:3000/payment/result", 
        "vnp_IpAddr": "113.160.1.1",  # IP Public giả lập
        "vnp_CreateDate": create_date,

    }

    url = vnp.get_payment_url("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", VNP_HASH_SECRET)
    
    print("-" * 60)
    print("👉 LINK NÀY ĐÃ LOẠI BỎ EXPIRE DATE & IPN URL (GIỐNG NODEJS):")
    print("-" * 60)
    print(url)
    print("-" * 60)