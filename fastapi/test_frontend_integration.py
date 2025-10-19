"""
Test Frontend Integration
=========================
Quick test to verify backend is ready for frontend integration
"""

import requests

BACKEND_URL = "https://fastapi-eight-zeta.vercel.app"
FRONTEND_URL = "https://advotac02.vercel.app"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*80)
    print("Testing Health Endpoint")
    print("="*80)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {data.get('status')}")
            print(f"✅ Database: {data.get('database')}")
            print(f"✅ Environment: {data.get('environment')}")
            return True
        else:
            print(f"❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_oauth_redirect():
    """Test OAuth redirect"""
    print("\n" + "="*80)
    print("Testing OAuth Redirect")
    print("="*80)
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/google", allow_redirects=False, timeout=10)
        if response.status_code in [302, 307]:
            location = response.headers.get('Location', '')
            if 'accounts.google.com' in location:
                print(f"✅ Redirects to Google OAuth")
                print(f"   {location[:80]}...")
                return True
            else:
                print(f"❌ Invalid redirect location")
                return False
        else:
            print(f"❌ No redirect, status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_api_auth_url():
    """Test API auth URL endpoint"""
    print("\n" + "="*80)
    print("Testing API Auth URL Endpoint")
    print("="*80)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/auth/google-url", timeout=10)
        if response.status_code == 200:
            data = response.json()
            auth_url = data.get('auth_url', '')
            redirect_uri = data.get('redirect_uri', '')
            
            print(f"✅ Auth URL provided")
            print(f"   Redirect URI: {redirect_uri}")
            
            if 'accounts.google.com' in auth_url:
                print(f"✅ Valid Google OAuth URL")
                return True
            else:
                print(f"❌ Invalid auth URL")
                return False
        else:
            print(f"❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def verify_configuration():
    """Verify configuration"""
    print("\n" + "="*80)
    print("Configuration Verification")
    print("="*80)
    
    print(f"\n📌 Backend URL: {BACKEND_URL}")
    print(f"📌 Frontend URL: {FRONTEND_URL}")
    print(f"\n✅ Expected OAuth Flow:")
    print(f"   1. User visits: {FRONTEND_URL}/auth")
    print(f"   2. Clicks login → Redirects to: {BACKEND_URL}/auth/google")
    print(f"   3. Backend → Google OAuth")
    print(f"   4. Google → Backend callback: {BACKEND_URL}/auth/google/callback")
    print(f"   5. Backend → Frontend dashboard: {FRONTEND_URL}/test_dashboard?token=...")
    print(f"\n⚠️  IMPORTANT: Update Google Console redirect URI:")
    print(f"   {BACKEND_URL}/auth/google/callback")

def main():
    print("\n" + "="*80)
    print("🔍 Frontend Integration Test")
    print("="*80)
    
    results = {
        'Health Check': test_health(),
        'OAuth Redirect': test_oauth_redirect(),
        'API Auth URL': test_api_auth_url()
    }
    
    verify_configuration()
    
    print("\n" + "="*80)
    print("Test Results Summary")
    print("="*80)
    
    passed = sum(results.values())
    total = len(results)
    
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is ready for frontend integration.")
        print("\n📚 Next Steps:")
        print("   1. Read: FRONTEND_INTEGRATION_READY.md")
        print("   2. Update Google Console redirect URI")
        print("   3. Implement frontend /auth page")
        print("   4. Implement frontend /test_dashboard page")
        print("   5. Test the complete flow!")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()
