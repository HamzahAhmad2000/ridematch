#!/usr/bin/env python3
"""
Simple test script to verify backend endpoints are accessible
Run this after starting the Flask server to test connectivity
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://10.0.2.2:5000/api"

def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health endpoint: {response.status_code} - {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health endpoint failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    endpoints = [
        ("/auth/register", "POST"),
        ("/auth/login", "POST"),
    ]
    
    for endpoint, method in endpoints:
        try:
            if method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            else:
                response = requests.get(f"{BASE_URL}{endpoint}")
            
            print(f"{method} {endpoint}: {response.status_code}")
            
        except Exception as e:
            print(f"{method} {endpoint} failed: {e}")

def test_protected_endpoints():
    """Test protected endpoints (should return 401 without token)"""
    endpoints = [
        ("/users/profile", "GET"),
        ("/rides/available", "GET"),
        ("/matches/companions", "GET"),
        ("/wallet/info", "GET"),
        ("/messages/conversations", "GET"),
        ("/safety/report", "POST"),
    ]
    
    for endpoint, method in endpoints:
        try:
            if method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            else:
                response = requests.get(f"{BASE_URL}{endpoint}")
            
            # Should return 401 (Unauthorized) or 422 (Unprocessable Entity) for missing JWT
            expected_codes = [401, 422]
            status_ok = response.status_code in expected_codes
            status_indicator = "✓" if status_ok else "✗"
            
            print(f"{status_indicator} {method} {endpoint}: {response.status_code}")
            
        except Exception as e:
            print(f"✗ {method} {endpoint} failed: {e}")

if __name__ == "__main__":
    print("Testing Backend API Endpoints")
    print("=" * 40)
    
    print("\n1. Testing Health Endpoint:")
    health_ok = test_health_endpoint()
    
    print("\n2. Testing Auth Endpoints:")
    test_auth_endpoints()
    
    print("\n3. Testing Protected Endpoints (should return 401/422):")
    test_protected_endpoints()
    
    print("\n" + "=" * 40)
    if health_ok:
        print("✓ Backend is accessible from Android emulator IP (10.0.2.2)")
    else:
        print("✗ Backend is NOT accessible - check if server is running on 0.0.0.0:5000")
    
    print("\nTo start the backend server, run:")
    print("cd backend && python run.py") 