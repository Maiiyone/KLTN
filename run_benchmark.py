import csv
import json
import asyncio
import httpx
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001"
USER_ID = 4
DATASET_PATH = "d:/WEB/KLTN/dataset_fixed_100.csv"
OUTPUT_DIR = "d:/WEB/KLTN/evaluation_data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "benchmark_raw_responses.json")
CONCURRENCY = 5  # Number of concurrent requests

async def create_session(client, user_id: int) -> str:
    response = await client.post(
        f"{BASE_URL}/api/v1/chatbot/session",
        json={"user_id": user_id}
    )
    response.raise_for_status()
    return response.json()["session_id"]

async def process_query(client, session_id: str, item: dict) -> dict:
    try:
        start_time = time.time()
        response = await client.post(
            f"{BASE_URL}/api/v1/chatbot/message",
            json={
                "session_id": session_id,
                "message": item["query"],
                "user_id": USER_ID
            },
            timeout=30.0
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            return {
                "id": item["id"],
                "difficulty": item["difficulty"],
                "gold": item["gold"],
                "query": item["query"],
                "expected": item["expected"],
                "chatbot_response": data.get("reply", ""),
                "chatbot_context": data.get("context", {}),
                "latency": round(elapsed, 2),
                "error": None
            }
        else:
             return {
                "id": item["id"],
                "difficulty": item["difficulty"],
                "gold": item["gold"],
                "query": item["query"],
                "expected": item["expected"],
                "chatbot_response": "",
                "chatbot_context": {},
                "latency": round(elapsed, 2),
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {
            "id": item["id"],
            "difficulty": item["difficulty"],
            "gold": item["gold"],
            "query": item["query"],
            "expected": item["expected"],
            "chatbot_response": "",
            "chatbot_context": {},
            "latency": 0,
            "error": str(e)
        }

def load_dataset(path: str) -> list:
    items = []
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append({
                "id": int(row["id"]),
                "difficulty": row["difficulty"],
                "gold": row["gold"],
                "query": row["query"],
                "expected": row["expected"]
            })
    return items

async def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print(f"Loading dataset from {DATASET_PATH}...")
    items = load_dataset(DATASET_PATH)
    print(f"Loaded {len(items)} items.")
    
    async with httpx.AsyncClient() as client:
        print("Creating session...")
        session_id = await create_session(client, USER_ID)
        print(f"Session ID: {session_id}")
        
        print(f"Starting benchmark with concurrency={CONCURRENCY}...")
        results = []
        
        # Process in chunks to respect concurrency
        for i in range(0, len(items), CONCURRENCY):
            batch = items[i : i + CONCURRENCY]
            print(f"Processing batch {i} to {i+len(batch)}...")
            tasks = [process_query(client, session_id, item) for item in batch]
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
            # Small delay to be gentle on the server
            await asyncio.sleep(0.5)
            
    print(f"Saving results to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
