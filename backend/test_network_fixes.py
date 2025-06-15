#!/usr/bin/env python3
"""
Test script to verify network fixes work correctly
"""

import requests
import json

def test_cors_and_connectivity():
    """Test CORS and basic connectivity"""
    
    base_urls = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://10.0.2.2:5000'  # This won't work from host machine but good to test
    ]
    
    print("Testing CORS and Connectivity Fixes")
    print("=" * 50)
    
    for base_url in base_urls:
        print(f"\nTesting: {base_url}")
        
        try:
            # Test health endpoint
            response = requests.get(f"{base_url}/api/health", timeout=5)
            print(f"  ✅ Health check: {response.status_code}")
            print(f"     Response: {response.json()}")
            
            # Check CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            }
            
            print(f"  🌐 CORS Headers:")
            for header, value in cors_headers.items():
                if value:
                    print(f"     {header}: {value}")
            
            # Test OPTIONS request (preflight)
            options_response = requests.options(f"{base_url}/api/health", timeout=5)
            print(f"  ✅ OPTIONS request: {options_response.status_code}")
            
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection failed - server not reachable")
        except requests.exceptions.Timeout:
            print(f"  ❌ Timeout - server too slow")
        except Exception as e:
            print(f"  ❌ Error: {e}")

def test_api_endpoints():
    """Test various API endpoints"""
    
    base_url = "http://localhost:5000/api"
    
    print(f"\n\nTesting API Endpoints")
    print("=" * 50)
    
    # Test endpoints that should work without auth
    public_endpoints = [
        ("/health", "GET"),
        ("/auth/register", "POST"),
        ("/auth/login", "POST"),
    ]
    
    for endpoint, method in public_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, json={}, timeout=5)
            
            print(f"  {method} {endpoint}: {response.status_code}")
            
            # Check if response has CORS headers
            if 'Access-Control-Allow-Origin' in response.headers:
                print(f"    ✅ CORS enabled")
            else:
                print(f"    ⚠️  CORS headers missing")
                
        except Exception as e:
            print(f"  ❌ {method} {endpoint}: {e}")

if __name__ == "__main__":
    test_cors_and_connectivity()
    test_api_endpoints()
    
    print("\n" + "=" * 50)
    print("🔧 Network Fixes Test Complete")
    print("\nIf you see ✅ for localhost:5000, the backend is working correctly.")
    print("The Android emulator should be able to connect via 10.0.2.2:5000")
    print("\nNext steps:")
    print("1. Restart your backend server")
    print("2. Test the mobile app")
    print("3. Use the NetworkTestButton in your app for further diagnostics") 