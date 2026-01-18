#!/usr/bin/env python3
"""
Test script for login functionality
Demonstrates login with username, email, and admin bypass
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_login(username_or_email: str, password: str, description: str):
    """Test login endpoint"""
    print(f"\n{'='*60}")
    print(f"Test: {description}")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/auth/login"
    payload = {
        "username_or_email": username_or_email,
        "password": password
    }
    
    print(f"Request URL: {url}")
    print(f"Request Body: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload)
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Login successful!")
            return response.json()["access_token"]
        else:
            print("\n❌ Login failed!")
            return None
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

def test_get_profile(token: str):
    """Test getting user profile with token"""
    print(f"\n{'='*60}")
    print(f"Test: Get Current User Profile")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Request URL: {url}")
    print(f"Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Profile retrieved successfully!")
        else:
            print("\n❌ Failed to get profile!")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("LOGIN API TEST SUITE")
    print("="*60)
    print("\nMake sure the server is running at http://localhost:8000")
    print("You can create test users first using the register endpoint")
    
    # Test 1: Login with email (normal user)
    token = test_login(
        "user@example.com",
        "password123",
        "Login with Email (Normal User)"
    )
    if token:
        test_get_profile(token)
    
    # Test 2: Login with username (normal user)
    token = test_login(
        "johndoe",
        "password123",
        "Login with Username (Normal User)"
    )
    if token:
        test_get_profile(token)
    
    # Test 3: Login with admin@gmail.com (password bypass)
    token = test_login(
        "admin@gmail.com",
        "any_password_works",
        "Login with admin@gmail.com (Password Bypass)"
    )
    if token:
        test_get_profile(token)
    
    # Test 4: Login with wrong credentials
    test_login(
        "nonexistent@example.com",
        "wrongpassword",
        "Login with Wrong Credentials (Should Fail)"
    )
    
    print("\n" + "="*60)
    print("TEST SUITE COMPLETED")
    print("="*60 + "\n")

