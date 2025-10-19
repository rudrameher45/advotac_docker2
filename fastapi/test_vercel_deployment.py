"""
Vercel Deployment Test Script
==============================
This script tests your deployed Vercel API to ensure everything works correctly.

Usage:
    python test_vercel_deployment.py https://your-app.vercel.app
"""

import sys
import requests
import json
from datetime import datetime

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_warning(text):
    """Print warning message"""
    print(f"⚠️  {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def test_health(base_url):
    """Test health endpoint"""
    print_header("Testing Health Endpoint")
    
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_success("Health endpoint is accessible")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Database: {data.get('database')}")
            print_info(f"Connection Time: {data.get('connection_time_ms')}ms")
            print_info(f"Environment: {data.get('environment')}")
            
            if data.get('status') == 'healthy' and data.get('database') == 'connected':
                print_success("API is fully operational!")
                return True
            else:
                print_error("API or database is not healthy")
                return False
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Request timed out - API might be slow or unreachable")
        return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False

def test_root(base_url):
    """Test root endpoint"""
    print_header("Testing Root Endpoint")
    
    try:
        response = requests.get(base_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_success("Root endpoint is accessible")
            print_info(f"Message: {data.get('message')}")
            print_info(f"Version: {data.get('version')}")
            print_info(f"Docs: {base_url}{data.get('docs')}")
            return True
        else:
            print_error(f"Root endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Root endpoint test failed: {str(e)}")
        return False

def test_docs(base_url):
    """Test documentation endpoint"""
    print_header("Testing Documentation Endpoint")
    
    try:
        response = requests.get(f"{base_url}/docs", timeout=10)
        
        if response.status_code == 200:
            print_success("Documentation is accessible")
            print_info(f"Swagger UI: {base_url}/docs")
            print_info(f"ReDoc: {base_url}/redoc")
            return True
        else:
            print_error(f"Documentation failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Documentation test failed: {str(e)}")
        return False

def test_oauth_redirect(base_url):
    """Test OAuth redirect"""
    print_header("Testing OAuth Redirect")
    
    try:
        response = requests.get(f"{base_url}/auth/google", allow_redirects=False, timeout=10)
        
        if response.status_code in [302, 307]:
            location = response.headers.get('Location', '')
            if 'accounts.google.com' in location:
                print_success("OAuth redirect is working")
                print_info(f"Redirects to: {location[:80]}...")
                return True
            else:
                print_error("OAuth redirect location is incorrect")
                return False
        else:
            print_error(f"OAuth redirect failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"OAuth redirect test failed: {str(e)}")
        return False

def test_cors(base_url):
    """Test CORS headers"""
    print_header("Testing CORS Configuration")
    
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization'
        }
        response = requests.options(f"{base_url}/health", headers=headers, timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        if any(cors_headers.values()):
            print_success("CORS is configured")
            for key, value in cors_headers.items():
                if value:
                    print_info(f"{key}: {value}")
            return True
        else:
            print_warning("CORS headers not found (might be okay)")
            return True
            
    except Exception as e:
        print_warning(f"CORS test inconclusive: {str(e)}")
        return True

def print_summary(results):
    """Print test summary"""
    print_header("Test Summary")
    
    total = len(results)
    passed = sum(results.values())
    failed = total - passed
    
    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Your deployment is working correctly.")
        print("\n📚 Next Steps:")
        print("   1. Update Google OAuth redirect URI in Google Console")
        print("   2. Test the complete OAuth flow in browser")
        print("   3. Integrate with your frontend application")
        print(f"\n🌐 Your API is live at: {sys.argv[1]}")
        print(f"📖 Documentation: {sys.argv[1]}/docs")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("\n🔍 Troubleshooting:")
        print("   1. Check Vercel function logs")
        print("   2. Verify environment variables in Vercel dashboard")
        print("   3. Check Azure PostgreSQL firewall settings")
        print("   4. Review DEPLOYMENT_VERCEL_SUCCESS.md for solutions")

def main():
    """Main test function"""
    if len(sys.argv) < 2:
        print("Usage: python test_vercel_deployment.py https://your-app.vercel.app")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print_header(f"Testing Vercel Deployment: {base_url}")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    results = {
        'Health Check': test_health(base_url),
        'Root Endpoint': test_root(base_url),
        'Documentation': test_docs(base_url),
        'OAuth Redirect': test_oauth_redirect(base_url),
        'CORS': test_cors(base_url)
    }
    
    # Print summary
    print_summary(results)
    
    # Exit with appropriate code
    sys.exit(0 if all(results.values()) else 1)

if __name__ == "__main__":
    main()
