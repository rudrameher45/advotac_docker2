"""Test Azure OpenAI connection and deployment names."""
import os
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables
load_dotenv()

def test_azure_connection():
    """Test Azure OpenAI connection with different deployment names."""
    
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    deployment_name = os.getenv("AZURE_OPENAI_ANALYSIS", "gpt-5-mini").strip()
    
    print("=" * 80)
    print("Azure OpenAI Configuration Test")
    print("=" * 80)
    print(f"Endpoint: {endpoint}")
    print(f"API Key: {'*' * 20}{api_key[-10:] if len(api_key) > 10 else '***'}")
    print(f"API Version: {api_version}")
    print(f"Deployment Name: '{deployment_name}'")
    print("=" * 80)
    
    if not endpoint or not api_key:
        print("❌ ERROR: Missing Azure OpenAI credentials!")
        return
    
    try:
        client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
        )
        
        print("\n✅ Client created successfully!")
        print("\n🔄 Testing chat completion with deployment:", deployment_name)
        
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, Azure OpenAI is working!' in one sentence."}
            ],
            max_completion_tokens=50
        )
        
        result = response.choices[0].message.content
        print("\n✅ SUCCESS! Response received:")
        print(f"   {result}")
        print("\n" + "=" * 80)
        print("✅ Azure OpenAI is configured correctly!")
        print("=" * 80)
        
    except Exception as e:
        print("\n❌ ERROR occurred:")
        print(f"   {type(e).__name__}: {str(e)}")
        print("\n" + "=" * 80)
        print("🔍 Troubleshooting Tips:")
        print("=" * 80)
        print("1. Check if deployment name is correct (use Azure Portal)")
        print("2. Common deployment names: gpt-4, gpt-35-turbo, gpt-4o")
        print("3. Ensure the deployment exists in your Azure OpenAI resource")
        print("4. Verify API key and endpoint are correct")
        print("5. Check if the API version is supported")
        print("\n📝 To find your deployment name:")
        print("   - Go to Azure Portal > Azure OpenAI Studio")
        print("   - Navigate to 'Deployments' section")
        print("   - Copy the exact 'Deployment name' (NOT the model name)")
        

if __name__ == "__main__":
    test_azure_connection()
