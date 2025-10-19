#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advotac CMD Chatbase (Multi-Collection Edition)
- Merges advotac_acts_L1 / L2 / L3
- Uses identical prompt engineering stack (Rewriter → Reranker → Generator → Validator)
- Internal layer weighting preserved
"""

import os, re, json, time, sys, threading, argparse
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from qdrant_client import QdrantClient
from openai import AzureOpenAI
from pydantic import BaseModel


def _normalize_deployment_name(name: Optional[str], default: str) -> str:
    """
    Azure deployment ids are user-defined; translate common model aliases
    so env configs like `4o` resolve to the actual deployment name.
    """
    alias_map = {
        "4o": "gpt-4o",
        "gpt4o": "gpt-4o",
        "gpt_4o": "gpt-4o",
        "4o-mini": "gpt-4o-mini",
        "gpt4o-mini": "gpt-4o-mini",
        "gpt_4o_mini": "gpt-4o-mini",
    }
    cleaned = (name or "").strip()
    if not cleaned:
        return default
    return alias_map.get(cleaned.lower(), cleaned)

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-3-large")
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = _normalize_deployment_name(
    os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"),
    "gpt-4o",
)

QDRANT_URL = os.getenv("QDRANT_URL", "https://qdrant.advotac.com")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTIONS = ["advotac_acts_L1", "advotac_acts_L2", "advotac_acts_L3"]
LAYER_WEIGHTS = {"L1": 0.15, "L2": 0.55, "L3": 0.30}

# -------------------------- CLIENTS --------------------------
llm = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
)
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# -------------------------- SPINNER --------------------------
class Spinner:
    def __init__(self, text="Thinking"):
        self.text, self._stop = text, threading.Event()
        self._thread = threading.Thread(target=self._spin, daemon=True)
    def _spin(self):
        frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
        i = 0
        while not self._stop.is_set():
            sys.stdout.write(f"\r{self.text}... {frames[i%len(frames)]}")
            sys.stdout.flush(); time.sleep(0.08); i+=1
        sys.stdout.write("\r" + " "*(len(self.text)+10) + "\r"); sys.stdout.flush()
    def start(self): self._stop.clear(); self._thread.start()
    def stop(self): self._stop.set(); self._thread.join()

# -------------------------- DATA MODEL --------------------------
@dataclass
class Hit:
    score: float
    collection: str
    payload: dict


class Source(BaseModel):
    """API representation of a retrieved chunk."""

    collection: str
    score: float
    layer: str
    act_title: Optional[str] = None
    context_path: Optional[str] = None
    heading: Optional[str] = None
    unit_id: Optional[str] = None
    snippet: Optional[str] = None


class AnswerResponse(BaseModel):
    """Structured response returned by the Advotac multi-collection pipeline."""

    query: str
    answer: str
    expanded_queries: List[str]
    sources: List[Source]
    validation: Optional[str] = None

# -------------------------- EMBEDDINGS --------------------------
def embed(text: str) -> List[float]:
    res = llm.embeddings.create(model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME, input=text)
    return res.data[0].embedding

# -------------------------- SEARCH --------------------------
def multi_search(query_vec: List[float], top_k: int = 15) -> List[Hit]:
    results = []
    for col in COLLECTIONS:
        try:
            res = qdrant.search(collection_name=col, query_vector=query_vec, limit=top_k)
            for r in res:
                results.append(Hit(score=r.score or 0.0, collection=col, payload=r.payload))
        except Exception as e:
            print(f"[warn] {col}: {e}")
    results.sort(key=lambda x: x.score, reverse=True)
    return results


def _resolve_layer(payload: Dict[str, Any], collection: str) -> str:
    """Guess the layer (L1/L2/L3) for a retrieved payload."""
    for key in ("layer", "level", "chunk_level"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            val = value.strip().upper()
            if val in {"L1", "L2", "L3"}:
                return val
    if collection:
        suffix = collection.split("_")[-1].upper()
        if suffix in {"L1", "L2", "L3"}:
            return suffix
    if payload.get("sub_section"):
        return "L3"
    if payload.get("section_number"):
        return "L2"
    return "L1"


def _hit_to_source(hit: Hit) -> Source:
    payload = hit.payload or {}
    snippet = (payload.get("page_content") or payload.get("content") or "").strip()
    if snippet:
        snippet = snippet[:600]
    return Source(
        collection=hit.collection,
        score=float(hit.score or 0.0),
        layer=_resolve_layer(payload, hit.collection),
        act_title=payload.get("act_title"),
        context_path=payload.get("context_path"),
        heading=payload.get("heading"),
        unit_id=payload.get("unit_id"),
        snippet=snippet or None,
    )

# -------------------------- LAYER SPLIT --------------------------
def split_context_by_layer(hits: List[Hit], max_chars: int = 8000):
    l1, l2, l3, total = [], [], [], 0
    for h in hits:
        p = h.payload
        layer = p.get("layer") or h.collection.split("_")[-1].upper()
        text = p.get("page_content") or p.get("content") or ""
        meta = f"{p.get('act_title','')} | {p.get('context_path','')} | {p.get('heading','')}"
        block = f"[[META]] {meta}\n[[TEXT]] {text}\n"
        if total + len(block) > max_chars: break
        if layer == "L1": l1.append(block)
        elif layer == "L2": l2.append(block)
        elif layer == "L3": l3.append(block)
        total += len(block)
    return "\n---\n".join(l1), "\n---\n".join(l2), "\n---\n".join(l3)

# -------------------------- PROMPTS --------------------------
def rewrite_queries(user_query: str) -> List[str]:
    system_msg = (
        "You are a retrieval rewriter for the Advotac Legal AI system.\n"
        "Rewrite the user’s legal question into precise statutory search queries for the Indian Central Acts dataset.\n"
        "Rules:\n"
        "1. Extract Act names, section numbers, keywords.\n"
        "2. Output 3–5 short factual queries (Indian context only).\n"
        'Output JSON list, e.g. ["Section 5 Hindu Marriage Act 1955", "Conditions for valid Hindu marriage"].'
    )
    try:
        resp = llm.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME, temperature=0,
            max_tokens=200,
            messages=[{"role":"system","content":system_msg},{"role":"user","content":user_query}]
        )
        return json.loads(resp.choices[0].message.content)
    except Exception: return [user_query]

def llm_rerank(user_query: str, hits: List[Hit]) -> Optional[List[Tuple[float, Hit]]]:
    if not hits: return None
    items=[]
    for i,h in enumerate(hits[:20]):
        p=h.payload; meta=f"{p.get('act_title','')} | {p.get('context_path','')} | {p.get('heading','')}"
        items.append({"id":i,"layer":p.get("layer") or h.collection.split('_')[-1].upper(),"meta":meta,"text":(p.get("page_content") or '')[:1000]})
    system_msg=(
        "You are a legal reranker. Rank retrieved chunks (L1–L3) by relevance to the question.\n"
        "Prefer L3 for direct rules, L2 for support, L1 for hierarchy.\n"
        "Output JSON: [{'layer':'L3','id':0,'score':0.94,'reason':'defines rule...'}]"
    )
    try:
        r=llm.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,temperature=0,max_tokens=700,
            messages=[{"role":"system","content":system_msg},{"role":"user","content":json.dumps({'q':user_query,'chunks':items},ensure_ascii=False)}]
        )
        ranked=json.loads(r.choices[0].message.content)
        scored=[]
        for row in ranked:
            if "id" in row and "score" in row:
                idx=int(row["id"])
                if 0<=idx<len(items): scored.append((float(row["score"]),hits[idx]))
        scored.sort(key=lambda x:x[0],reverse=True)
        return scored
    except Exception: return None

def generate_answer(user_query:str,l1:str,l2:str,l3:str)->str:
    system_msg=("You are Advotac Legal AI, precision-based assistant for Indian law. Use the retrieved context (L1–L3).")
    user_msg=f"""
Context:
L1:{l1 or '[none]'}
L2:{l2 or '[none]'}
L3:{l3 or '[none]'}
Question:{user_query}

Follow format:
1️⃣ Section & Act Name
2️⃣ Core Rule(s)
3️⃣ Key Provisos / Exceptions / Definitions
4️⃣ Penalty / Procedure / Remedies
5️⃣ Drafting / Practical Notes
6️⃣ Final Citation
If unclear → say "No directly relevant section found."
"""
    r=llm.chat.completions.create(model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,temperature=0.1,max_tokens=900,
        messages=[{"role":"system","content":system_msg},{"role":"user","content":user_msg}])
    return r.choices[0].message.content.strip()

def validate_citations(ans,l1,l2,l3):
    sys_msg=("You are a legal citation validator. Check that all Acts/sections cited exist in retrieved context. Respond with '✅ Verified' or '⚠️ Possibly inaccurate'.")
    user_msg=f"Answer:\n{ans}\n\nContext:\nL1:{l1}\nL2:{l2}\nL3:{l3}"
    try:
        r=llm.chat.completions.create(model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,temperature=0,max_tokens=200,
            messages=[{"role":"system","content":sys_msg},{"role":"user","content":user_msg}])
        return r.choices[0].message.content.strip()
    except Exception as e: return f"(validator error: {e})"

def generate_answer_fallback(user_query: str) -> str:
    """
    Produce a best-effort answer even when retrieval returns no context.
    Ensures parity with CLI behaviour by allowing the model to draw on its own legal knowledge.
    """
    system_msg = (
        "You are Advotac Legal AI, an authoritative assistant on Indian central statutes. "
        "When retrieval context is unavailable, rely on your statutory knowledge to answer precisely. "
        "Cite the relevant Act and section explicitly. If genuinely uncertain, only then say "
        "'No directly relevant section found.'"
    )
    user_msg = (
        "No contextual passages were retrieved. Using the best of your legal knowledge, respond to:\n"
        f"{user_query}\n\n"
        "Follow the canonical format:\n"
        "1️⃣ Section & Act Name\n"
        "2️⃣ Core Rule(s)\n"
        "3️⃣ Key Provisos / Exceptions / Definitions\n"
        "4️⃣ Penalty / Procedure / Remedies\n"
        "5️⃣ Drafting / Practical Notes\n"
        "6️⃣ Final Citation\n"
    )
    r = llm.chat.completions.create(
        model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,
        temperature=0.1,
        max_tokens=800,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
    )
    return r.choices[0].message.content.strip()


def answer_query(
    query: str,
    top_k: int = 5,
    threshold: float = 0.7,
    validate: bool = True,
) -> AnswerResponse:
    """
    Execute the Advotac multi-collection pipeline and return a structured response.
    Mirrors the CLI behaviour so that even in low-retrieval scenarios the LLM still responds.
    """
    normalized_query = (query or "").strip()
    if not normalized_query:
        raise ValueError("Query must not be empty.")
    if top_k <= 0:
        raise ValueError("top_k must be a positive integer.")
    if not 0 <= threshold <= 1:
        raise ValueError("threshold must be between 0 and 1.")

    expanded = rewrite_queries(normalized_query)

    try:
        query_vector = embed(normalized_query)
    except Exception as exc:
        raise RuntimeError("Failed to create embedding for the query.") from exc

    try:
        wide_hits = multi_search(query_vector, top_k=max(15, top_k * 8))
    except Exception as exc:
        raise RuntimeError("Vector search against Qdrant failed.") from exc

    reranked = llm_rerank(normalized_query, wide_hits)
    ordered_hits: List[Hit]
    if reranked:
        ordered_hits = [hit for _, hit in reranked]
    else:
        ordered_hits = wide_hits

    filtered_hits = [hit for hit in ordered_hits if (hit.score or 0.0) >= threshold]
    top_hits = filtered_hits[:top_k] if filtered_hits else ordered_hits[:top_k]

    if top_hits:
        l1_texts, l2_texts, l3_texts = split_context_by_layer(top_hits)
        try:
            answer_text = generate_answer(normalized_query, l1_texts, l2_texts, l3_texts)
        except Exception as exc:
            raise RuntimeError("Failed to generate answer from the language model.") from exc
    else:
        l1_texts = l2_texts = l3_texts = ""
        answer_text = generate_answer_fallback(normalized_query)

    validation_result: Optional[str] = None
    if validate and top_hits:
        try:
            validation_result = validate_citations(answer_text, l1_texts, l2_texts, l3_texts)
        except Exception as exc:
            validation_result = f"(validator error: {exc})"

    sources = [_hit_to_source(hit) for hit in top_hits]

    return AnswerResponse(
        query=normalized_query,
        answer=answer_text,
        expanded_queries=expanded,
        sources=sources,
        validation=validation_result,
    )


# -------------------------- MAIN PIPELINE --------------------------
def handle_query_once(query:str,top_k:int=5,threshold:float=0.7,validate=True):
    spin=Spinner("Thinking"); spin.start()
    try:
        response = answer_query(query, top_k=top_k, threshold=threshold, validate=validate)
    finally:
        spin.stop()
    print("\n[Expanded Queries]",response.expanded_queries)
    print("\n"+("="*70)); print(response.answer)
    if response.validation: print("\n[ Citation Check ]",response.validation)
    print("\n— Sources:")
    for i,src in enumerate(response.sources[:3],1):
        print(f"{i}. [{src.collection}] {src.act_title or ''} — {src.heading or ''} ({src.unit_id or ''})")

# -------------------------- CLI --------------------------
def main():
    parser=argparse.ArgumentParser(description="Advotac CMD Multi-Collection")
    parser.add_argument("--once",type=str); parser.add_argument("--top-k",type=int,default=5)
    parser.add_argument("--threshold",type=float,default=0.7)
    args=parser.parse_args()
    if args.once: handle_query_once(args.once,args.top_k,args.threshold)
    else:
        print("\n⚖️ Advotac CMD Multi-Collection | L1–L3 | Enter :q to quit\n")
        while True:
            try: q=input("You: ").strip()
            except (EOFError,KeyboardInterrupt): break
            if q.lower() in {":q","exit","quit"}: break
            if q: handle_query_once(q,args.top_k,args.threshold)

if __name__=="__main__": main()
