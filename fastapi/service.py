import os
import json
from typing import Any, Dict, List, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import your pipeline pieces from the uploaded file
from advotac_chatbase_v2 import (
    embed, qdrant_search, llm_rerank, heuristic_rerank, weighted_blend,
    split_context_by_layer, generate_answer, validate_citations, detect_layer,
    QDRANT_COLLECTION
)

load_dotenv()

TOP_K_DEFAULT = int(os.getenv("ADVOTAC_TOP_K", "10"))
THRESHOLD_DEFAULT = float(os.getenv("ADVOTAC_THRESHOLD", "0.70"))
VALIDATE_DEFAULT = os.getenv("ADVOTAC_VALIDATE", "true").lower() != "false"

app = FastAPI(title="Advotac RAG API", version="1.0.0")

# Allow Next.js origin
NEXT_PUBLIC_ORIGIN = os.getenv("NEXT_PUBLIC_ORIGIN", "https://advotac.com/")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[NEXT_PUBLIC_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryIn(BaseModel):
    query: str
    top_k: int | None = None
    threshold: float | None = None
    validate: bool | None = None

def _pretty_meta(hit_payload: dict) -> str:
    act = hit_payload.get("doc_title","")
    sec = hit_payload.get("section_number_norm") or hit_payload.get("section_number") or ""
    head = hit_payload.get("section_heading","")
    crumbs = hit_payload.get("breadcrumbs","")
    line = f"{act} — Section {sec}: {head}".strip()
    return (line + ("\n" + crumbs if crumbs else "")).strip()

@app.get("/health")
def health():
    return {"ok": True, "collection": QDRANT_COLLECTION}
