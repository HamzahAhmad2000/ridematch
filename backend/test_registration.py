#!/usr/bin/env python3
"""
Test script to verify the registration flow works correctly
"""

import requests
import json
import uuid

# Base URL for the API
BASE_URL = "http://10.0.2.2:5000/api"

def test_registration_flow():
    """Test the complete registration flow"""
    
    # Generate unique test data
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    # Step 1: Register user
    print("Step 1: Testing user registration...")
    registration_data = {
        "name": "Test User",
        "email": test_email,
        "password": "TestPass123!",
        "gender": "Male",
        "dateOfBirth": "1995-01-01",
        "phone": "+1234567890"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=registration_data)
        print(f"Registration response: {response.status_code}")
        print(f"Response data: {response.text}")
        
        if response.status_code == 201:
            user_data = response.json()
            user_id = user_data.get('user_id')
            print(f"✓ User registered successfully with ID: {user_id}")
            
            # Step 2: Create profile
            print("\nStep 2: Testing profile creation...")
            profile_data = {
                "user_id": user_id,
                "university": "Universiti Malaya (UM)",
                "emergencyContact": "+1234567890",
                "genderPreference": "Any",
                "likes": "Music, Sports, Reading",
                "dislikes": "Smoking, Loud music",
                "studentCardURL": "https://example.com/student_card.jpg"
            }
            
            profile_response = requests.post(f"{BASE_URL}/auth/register-profile", json=profile_data)
            print(f"Profile response: {profile_response.status_code}")
            print(f"Profile data: {profile_response.text}")
            
            if profile_response.status_code == 201:
                print("✓ Profile created successfully")
                
                # Step 3: Test login
                print("\nStep 3: Testing login...")
                login_data = {
                    "email": test_email,
                    "password": "TestPass123!"
                }
                
                login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
                print(f"Login response: {login_response.status_code}")
                print(f"Login data: {login_response.text}")
                
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    access_token = login_result.get('access_token')
                    print(f"✓ Login successful, token: {access_token[:20]}...")
                    
                    # Step 4: Test protected endpoint
                    print("\nStep 4: Testing protected endpoint...")
                    headers = {"Authorization": f"Bearer {access_token}"}
                    profile_get_response = requests.get(f"{BASE_URL}/users/profile", headers=headers)
                    print(f"Get profile response: {profile_get_response.status_code}")
                    print(f"Profile info: {profile_get_response.text}")
                    
                    if profile_get_response.status_code == 200:
                        print("✓ Protected endpoint access successful")
                        return True
                    else:
                        print("✗ Protected endpoint access failed")
                else:
                    print("✗ Login failed")
            else:
                print("✗ Profile creation failed")
        else:
            print("✗ User registration failed")
            
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
    
    return False

def test_field_validation():
    """Test field validation"""
    print("\n" + "="*50)
    print("Testing field validation...")
    
    # Test with missing required fields
    invalid_data = {
        "name": "",
        "email": "invalid-email",
        "password": "weak"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=invalid_data)
        print(f"Validation test response: {response.status_code}")
        print(f"Validation response: {response.text}")
        
        if response.status_code == 400:
            print("✓ Validation working correctly")
        else:
            print("✗ Validation not working as expected")
            
    except Exception as e:
        print(f"✗ Validation test failed: {e}")

if __name__ == "__main__":
    print("Testing Registration Flow")
    print("=" * 50)
    
    success = test_registration_flow()
    test_field_validation()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ ALL TESTS PASSED - Registration flow is working!")
    else:
        print("❌ TESTS FAILED - Check backend logs for details")
    
    print("\nMake sure MongoDB is running and backend server is started with:")
    print("cd backend && python run.py") 