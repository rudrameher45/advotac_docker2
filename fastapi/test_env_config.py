"""
Test script to validate environment variables configuration
Run this to ensure all required environment variables are set correctly
"""

import os
from dotenv import load_dotenv
from colorama import Fore, Style, init

# Initialize colorama for colored output
init(autoreset=True)

# Load environment variables
load_dotenv()

def check_var(var_name, required=True, secret=False):
    """Check if an environment variable is set"""
    value = os.getenv(var_name)
    
    if value:
        if secret:
            # Mask sensitive values
            display_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
        else:
            display_value = value
        
        print(f"{Fore.GREEN}✓ {var_name}: {display_value}")
        return True
    else:
        if required:
            print(f"{Fore.RED}✗ {var_name}: MISSING (Required)")
            return False
        else:
            print(f"{Fore.YELLOW}⚠ {var_name}: Not set (Optional)")
            return True

def test_database_connection():
    """Test database connection"""
    try:
        import psycopg2
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print(f"{Fore.RED}✗ DATABASE_URL not set")
            return False
        
        # Parse connection string (basic test)
        if "postgresql://" in database_url:
            print(f"{Fore.GREEN}✓ Database URL format valid")
            return True
        else:
            print(f"{Fore.RED}✗ Invalid database URL format")
            return False
    except ImportError:
        print(f"{Fore.YELLOW}⚠ psycopg2 not installed, skipping database test")
        return True

def test_azure_openai():
    """Test Azure OpenAI configuration"""
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    
    if not endpoint or not api_key:
        print(f"{Fore.RED}✗ Azure OpenAI credentials not set")
        return False
    
    if endpoint.startswith("https://") and endpoint.endswith("/"):
        print(f"{Fore.GREEN}✓ Azure OpenAI endpoint format valid")
    else:
        print(f"{Fore.YELLOW}⚠ Azure OpenAI endpoint might need trailing slash")
    
    if len(api_key) > 30:
        print(f"{Fore.GREEN}✓ Azure OpenAI API key format valid")
    else:
        print(f"{Fore.RED}✗ Azure OpenAI API key seems too short")
        return False
    
    return True

def test_qdrant():
    """Test Qdrant configuration"""
    url = os.getenv("QDRANT_URL")
    collection = os.getenv("QDRANT_COLLECTION")
    
    if not url:
        print(f"{Fore.RED}✗ QDRANT_URL not set")
        return False
    
    if not collection:
        print(f"{Fore.RED}✗ QDRANT_COLLECTION not set")
        return False
    
    if url.startswith("http://") or url.startswith("https://"):
        print(f"{Fore.GREEN}✓ Qdrant URL format valid")
    else:
        print(f"{Fore.RED}✗ Invalid Qdrant URL format")
        return False
    
    print(f"{Fore.GREEN}✓ Qdrant collection: {collection}")
    return True

def main():
    print("\n" + "="*70)
    print(f"{Fore.CYAN}🔍 Environment Variables Configuration Test")
    print("="*70 + "\n")
    
    all_passed = True
    
    # Google OAuth
    print(f"\n{Fore.CYAN}📱 Google OAuth Configuration:")
    print("-" * 50)
    all_passed &= check_var("GOOGLE_CLIENT_ID", required=True)
    all_passed &= check_var("GOOGLE_CLIENT_SECRET", required=True, secret=True)
    all_passed &= check_var("GOOGLE_REDIRECT_URI", required=True)
    
    # Application Settings
    print(f"\n{Fore.CYAN}⚙️ Application Settings:")
    print("-" * 50)
    all_passed &= check_var("SECRET_KEY", required=True, secret=True)
    all_passed &= check_var("ALGORITHM", required=True)
    all_passed &= check_var("ACCESS_TOKEN_EXPIRE_MINUTES", required=True)
    all_passed &= check_var("FRONTEND_URL", required=True)
    all_passed &= check_var("BACKEND_URL", required=True)
    
    # Database
    print(f"\n{Fore.CYAN}🗄️ Database Configuration:")
    print("-" * 50)
    all_passed &= check_var("DATABASE_URL", required=True, secret=True)
    all_passed &= test_database_connection()
    
    # Azure OpenAI
    print(f"\n{Fore.CYAN}🤖 Azure OpenAI Configuration:")
    print("-" * 50)
    all_passed &= check_var("AZURE_OPENAI_ENDPOINT", required=True)
    all_passed &= check_var("AZURE_OPENAI_API_KEY", required=True, secret=True)
    all_passed &= check_var("AZURE_OPENAI_API_VERSION", required=True)
    all_passed &= test_azure_openai()
    
    # Azure OpenAI Deployments
    print(f"\n{Fore.CYAN}📦 Azure OpenAI Deployments:")
    print("-" * 50)
    all_passed &= check_var("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME", required=True)
    all_passed &= check_var("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", required=True)
    all_passed &= check_var("AZURE_OPENAI_ANALYSIS", required=True)
    all_passed &= check_var("AZURE_OPENAI_ANALYSIS_PRO", required=True)
    all_passed &= check_var("AZURE_OPENAI_BASE", required=True)
    all_passed &= check_var("AZURE_OPENAI_BASE_PRO", required=True)
    all_passed &= check_var("AZURE_OPENAI_SUMMARY", required=True)
    all_passed &= check_var("AZURE_OPENAI_SUMMARY_PRO", required=True)
    all_passed &= check_var("AZURE_OPENAI_TRANSLATE", required=True)
    all_passed &= check_var("AZURE_OPENAI_TRANSLATE_PRO", required=True)
    
    # Qdrant
    print(f"\n{Fore.CYAN}🔍 Qdrant Configuration:")
    print("-" * 50)
    all_passed &= check_var("QDRANT_URL", required=True)
    all_passed &= check_var("QDRANT_COLLECTION", required=True)
    all_passed &= test_qdrant()
    
    # LangChain
    print(f"\n{Fore.CYAN}🔗 LangChain/LangSmith:")
    print("-" * 50)
    all_passed &= check_var("LANGCHAIN_API_KEY", required=True, secret=True)
    all_passed &= check_var("LANGCHAIN_TRACING_V2", required=False)
    all_passed &= check_var("LANGCHAIN_PROJECT", required=False)
    
    # Redis (Optional)
    print(f"\n{Fore.CYAN}🔴 Redis Configuration (Optional):")
    print("-" * 50)
    check_var("REDIS_URL", required=False)
    check_var("CELERY_BROKER_URL", required=False)
    check_var("CELERY_RESULT_BACKEND", required=False)
    
    # Processing Settings
    print(f"\n{Fore.CYAN}⚡ AI Processing Settings:")
    print("-" * 50)
    check_var("DEFAULT_MODEL_MODE", required=False)
    check_var("MAX_QUERY_LENGTH", required=False)
    check_var("MAX_CONTEXT_LENGTH", required=False)
    check_var("REQUEST_TIMEOUT", required=False)
    
    # Credits
    print(f"\n{Fore.CYAN}💳 Credits System:")
    print("-" * 50)
    check_var("STANDARD_MODE_CREDITS", required=False)
    check_var("ADVANCED_MODE_CREDITS", required=False)
    
    # Feature Flags
    print(f"\n{Fore.CYAN}🎛️ Feature Flags:")
    print("-" * 50)
    check_var("ENABLE_ASSISTANT", required=False)
    check_var("ENABLE_RESEARCH", required=False)
    check_var("ENABLE_DRAFTING", required=False)
    check_var("ENABLE_WORKFLOW", required=False)
    check_var("ENABLE_PDF_GENERATION", required=False)
    check_var("ENABLE_DOCS_GENERATION", required=False)
    
    # Summary
    print("\n" + "="*70)
    if all_passed:
        print(f"{Fore.GREEN}✅ All required environment variables are configured!")
    else:
        print(f"{Fore.RED}❌ Some required environment variables are missing!")
        print(f"{Fore.YELLOW}⚠️ Please check the .env file and fix the issues above.")
    print("="*70 + "\n")
    
    return all_passed

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"{Fore.RED}❌ Error during testing: {str(e)}")
        exit(1)
