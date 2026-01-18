"""
Script để test chatbot với 5 queries đầu tiên từ dataset
và đánh giá kết quả theo rubric.
"""
import csv
import json
import requests
import time

# Configuration
BASE_URL = "http://localhost:8001"
USER_ID = 4
DATASET_PATH = "d:/WEB/KLTN/dataset_fixed_100.csv"
OUTPUT_PATH = "d:/WEB/KLTN/evaluation_results_test5.json"
NUM_QUERIES = 5  # Chỉ test 5 queries đầu tiên

def create_session(user_id: int) -> str:
    """Tạo session mới"""
    response = requests.post(
        f"{BASE_URL}/api/v1/chatbot/session",
        json={"user_id": user_id}
    )
    response.raise_for_status()
    return response.json()["session_id"]

def send_message(session_id: str, message: str, user_id: int) -> dict:
    """Gửi message đến chatbot"""
    response = requests.post(
        f"{BASE_URL}/api/v1/chatbot/message",
        json={
            "session_id": session_id,
            "message": message,
            "user_id": user_id
        }
    )
    response.raise_for_status()
    return response.json()

def load_dataset(path: str, num_items: int = None) -> list:
    """Load dataset từ CSV"""
    items = []
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if num_items and i >= num_items:
                break
            items.append({
                "id": int(row["id"]),
                "difficulty": row["difficulty"],
                "gold": row["gold"],
                "query": row["query"],
                "expected": row["expected"]
            })
    return items

def main():
    print("=" * 60)
    print("🚀 Chatbot Evaluation Test (5 queries)")
    print("=" * 60)
    
    # Load dataset
    print("\n📂 Loading dataset...")
    items = load_dataset(DATASET_PATH, NUM_QUERIES)
    print(f"   Loaded {len(items)} items")
    
    # Create session
    print(f"\n🔑 Creating session for user_id={USER_ID}...")
    try:
        session_id = create_session(USER_ID)
        print(f"   Session ID: {session_id}")
    except Exception as e:
        print(f"   ❌ Error creating session: {e}")
        return
    
    # Test each query
    results = []
    for item in items:
        print(f"\n📝 Testing ID={item['id']}: {item['query'][:50]}...")
        
        try:
            start_time = time.time()
            response = send_message(session_id, item["query"], USER_ID)
            elapsed = time.time() - start_time
            
            chatbot_reply = response.get("reply", "")
            
            results.append({
                "id": item["id"],
                "difficulty": item["difficulty"],
                "gold": item["gold"],
                "user_query": item["query"],
                "expected": item["expected"],
                "chatbot_response": chatbot_reply,
                "response_time_seconds": round(elapsed, 2)
            })
            
            print(f"   ✅ Response ({elapsed:.2f}s):")
            print(f"   📌 Expected: {item['expected'][:80] if item['expected'] else '(empty)'}...")
            print(f"   🤖 Reply: {chatbot_reply[:100]}...")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append({
                "id": item["id"],
                "difficulty": item["difficulty"],
                "gold": item["gold"],
                "user_query": item["query"],
                "expected": item["expected"],
                "chatbot_response": f"ERROR: {str(e)}",
                "response_time_seconds": None
            })
    
    # Save results
    print(f"\n💾 Saving results to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print(f"   Total queries: {len(results)}")
    print(f"   Output file: {OUTPUT_PATH}")
    print("=" * 60)

if __name__ == "__main__":
    main()
