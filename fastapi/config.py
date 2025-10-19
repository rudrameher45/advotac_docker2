import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load environment variables from fastapi/.env explicitly so serverless deployments pick them up
_ENV_PATH = Path(__file__).resolve().parent / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH, override=False)
else:
    load_dotenv()


def _clean_env(name: str, default: str = "") -> str:
    """Fetch an environment variable and normalize whitespace/quotes."""
    raw = os.getenv(name, default)
    if raw is None:
        return default
    value = raw.strip()
    if len(value) >= 2 and (
        (value.startswith('"') and value.endswith('"'))
        or (value.startswith("'") and value.endswith("'"))
    ):
        value = value[1:-1].strip()
    return value

class Settings:
    # PostgreSQL Database
    PGUSER: str = _clean_env("PGUSER", "rudra45")
    PGPORT: str = _clean_env("PGPORT", "5432")
    PGDATABASE: str = _clean_env("PGDATABASE", "fastapi_oauth_db")
    PGPASSWORD: str = _clean_env("PGPASSWORD", "Rohit()Ritika()")
    PGHOST: str = _clean_env("PGHOST", "openapitest1.postgres.database.azure.com")
    
    # Database URL (constructed from individual parts or from DATABASE_URL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}?sslmode=require"
    )
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = _clean_env("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = _clean_env("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = _clean_env("GOOGLE_REDIRECT_URI", "https://api.advotac.com//auth/google/callback")
    
    # JWT
    SECRET_KEY: str = _clean_env("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = _clean_env("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(_clean_env("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # URLs
    FRONTEND_URL: str = _clean_env("FRONTEND_URL", "https://advotac.com/")
    BACKEND_URL: str = _clean_env("BACKEND_URL", "https://apiadvotac.com/")
    
    # Google OAuth URLs
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    # Azure OpenAI
    AZURE_OPENAI_ENDPOINT: str = _clean_env(
        "AZURE_OPENAI_ENDPOINT",
        "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/",
    )
    AZURE_OPENAI_API_KEY: str = _clean_env(
        "AZURE_OPENAI_API_KEY",
        "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8",
    )
    AZURE_OPENAI_API_VERSION: str = _clean_env("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    AZURE_OPENAI_CHAT_DEPLOYMENT_NAME: str = _clean_env("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", "gpt-4o")
    AZURE_OPENAI_ANALYSIS: str = _clean_env("AZURE_OPENAI_ANALYSIS", "gpt-5-mini")
    AZURE_OPENAI_ANALYSIS_PRO: str = _clean_env("AZURE_OPENAI_ANALYSIS_PRO", "gpt-5")
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: str = _clean_env(
        "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME",
        "text-embedding-3-small",
    )

    # Qdrant defaults (vector store)
    QDRANT_URL: str = _clean_env("QDRANT_URL", "http://3.95.219.204:6333/")
    QDRANT_API_KEY: str = _clean_env("QDRANT_API_KEY", "")
    QDRANT_COLLECTION: str = _clean_env("QDRANT_COLLECTION", "central_acts_v2")

    # File uploads
    MAX_UPLOAD_SIZE: int = int(_clean_env("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024)))
    ALLOWED_EXTENSIONS: List[str] = _clean_env("ALLOWED_EXTENSIONS", "pdf,doc,docx,txt").split(",")

settings = Settings()
