import sys
import os
import json

# Add root to python path
sys.path.append(os.getcwd())

from chatbot.llm import LLMAnalyzer
from core.config import get_settings

def test_hybrid_knowledge():
    settings = get_settings()
    
    print("\n--- Testing Product Response Generation ---")
    try:
        analyzer = LLMAnalyzer(settings)
        
        # Test Case: General Nutrition Question + Some Products
        query = "thành phần dinh dưỡng của bắp cải"
        products = [
            {
                "product_name": "Bắp cải trái tim 400g",
                "price": 12000,
                "price_text": "12.000đ",
                "unit": "bắp",
                "discount_percent": 0,
                "product_url": "https://example.com/very-long-url-that-should-be-removed",
                "image_url": "https://example.com/image.jpg"
            }
        ]
        
        print(f"Query: {query}")
        response = analyzer.compose_product_response(
            query=query, 
            products=products
        )
        
        print("-" * 50)
        print(response)
        print("-" * 50)
        
        # Validation
        if "Bắp cải trái tim" in response and ("vitamin" in response.lower() or "chất xơ" in response.lower()):
            print("PASS: Response contains both nutritional info (internal knowledge) and product suggestion.")
        else:
            print("FAIL: Response missing nutrition info or product name.")
            
    except Exception as e:
        print(f"Error testing LLM: {e}")

if __name__ == "__main__":
    test_hybrid_knowledge()
