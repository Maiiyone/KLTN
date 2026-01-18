from pydantic_settings import BaseSettings
from typing import List, Optional, Union
from pydantic import field_validator
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "mysql+pymysql://local:123456@localhost:3306/local_db"
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # App
    app_name: str = "Bach Hoa Xanh API"
    debug: bool = True
    environment: str = "development"
    
    # CORS
    allowed_origins: Union[List[str], str] = "*"
    allowed_methods: Union[List[str], str] = "*"
    allowed_headers: Union[List[str], str] = "*"
    allow_credentials: bool = True
    
    @field_validator('allowed_origins', 'allowed_methods', 'allowed_headers', mode='before')
    @classmethod
    def parse_list(cls, v):
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [item.strip() for item in v.split(',')]
        return v
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    
    # Email (for future use)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: bool = True
    
    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB
    
    # Cache
    cache_ttl: int = 3600  # 1 hour

    # Payment - MoMo Configuration
    momo_partner_code: str = "MOMOBKUN20180529"  # Default test credentials
    momo_access_key: str = "klm05TvNBzhg7h7j"
    momo_secret_key: str = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa"
    momo_endpoint: str = "https://test-payment.momo.vn/v2/gateway/api/create"
    momo_ipn_url: Optional[str] = None  # Will be set based on domain
    
    # Payment - VNPay Configuration
    vnpay_tmn_code: str = "7EIDJUXT"  # Default test credentials
    vnpay_hash_secret: str = "9GYGAJPZO9JQO4LE257BTWK3WBSE1C4M"
    vnpay_url: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    vnpay_return_url: Optional[str] = None  # Will be set from frontend
    vnpay_ipn_url: Optional[str] = None  # Will be set based on domain
    vnpay_frontend_return_url:str ="http://localhost:3000/payment/result"
    # Payment General
    payment_timeout_minutes: int = 15  # Payment link expires after 15 minutes
    
    class Config:
        env_file = ".env"  # File .env ở root directory (BE/.env)
        case_sensitive = False

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

settings = Settings()
