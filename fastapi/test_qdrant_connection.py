#!/usr/bin/env python3
"""
Quick test script to verify Qdrant connection and collection access.
"""
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Load environment variables
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://3.95.219.204:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "central_acts_v2")

print(f"🔍 Testing Qdrant Connection...")
print(f"   URL: {QDRANT_URL}")
print(f"   Collection: {QDRANT_COLLECTION}")
print(f"   API Key: {'Set' if QDRANT_API_KEY else 'Not Set'}")
print()

try:
    # Initialize client
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print("✅ Client initialized successfully")
    
    # List collections
    collections = client.get_collections()
    print(f"✅ Collections available: {[c.name for c in collections.collections]}")
    
    # Check if our collection exists
    if QDRANT_COLLECTION in [c.name for c in collections.collections]:
        print(f"✅ Collection '{QDRANT_COLLECTION}' found!")
        
        # Get collection info
        info = client.get_collection(QDRANT_COLLECTION)
        print(f"   - Vectors count: {info.points_count}")
        print(f"   - Vector size: {info.config.params.vectors.size}")
    else:
        print(f"❌ Collection '{QDRANT_COLLECTION}' NOT found!")
        print(f"   Available collections: {[c.name for c in collections.collections]}")
        
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
    exit(1)

print()
print("✅ All checks passed! Qdrant is ready to use.")
