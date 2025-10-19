#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Advotac CMD Chatbase (RERANK FIX v2 - Precision Upgrade + Prompt Suite)
- Two-stage retrieval: wide recall + precise rerank
- LLM Prompts added:
  1) Retriever Rewriter (expanded legal subqueries for Indian Acts)
  2) Reranker (L1/L2/L3 aware, 0–1 scoring with reasons)
  3) Generator (accuracy-first synthesis with strict structure)
  4) (Optional) Citation Validator (consistency check)
- Internal weighting: L1=0.15, L2=0.55, L3=0.30
"""

import os
import re
import json
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict

from qdrant_client import QdrantClient
from openai import AzureOpenAI
from pydantic import BaseModel


def _normalize_deployment_name(name: Optional[str], default: str) -> str:
    """
    Azure expects the *deployment name* rather than the base model id.
    Map common aliases (e.g. `4o`) back to the canonical deployment label so
    we do not hit DeploymentNotFound when environments use shorthand names.
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

# -------------------------- ENV & Defaults --------------------------
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "https://24f30-m9hniqrf-swedencentral.cognitiveservices.azure.com/")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "8Ji4NZNjDUv2GLSX12MYBRyQzKygCpjyUaGicj3Bgu8clFyCanpQJQQJ99BDACfhMk5XJ3w3AAAAACOGegj8")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME", "text-embedding-3-small")
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = _normalize_deployment_name(
    os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"),
    "gpt-4o",
)

QDRANT_URL = os.getenv("QDRANT_URL", "http://3.95.219.204:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "central_acts_v2")

# -------------------------- API Models --------------------------
class Source(BaseModel):
    score: float
    layer: str
    doc_title: Optional[str] = None
    section_number: Optional[str] = None
    section_heading: Optional[str] = None
    breadcrumbs: Optional[str] = None
    snippet: Optional[str] = None

    @classmethod
    def from_hit(cls, hit: "Hit") -> "Source":
        payload = hit.payload or {}
        return cls(
            score=float(hit.score or 0.0),
            layer=detect_layer(payload),
            doc_title=payload.get("doc_title"),
            section_number=payload.get("section_number_norm") or payload.get("section_number"),
            section_heading=payload.get("section_heading"),
            breadcrumbs=payload.get("breadcrumbs"),
            snippet=(payload.get("search_text") or "").strip()[:600] or None,
        )

class AnswerResponse(BaseModel):
    query: str
    answer: str
    expanded_queries: List[str]
    sources: List[Source]
    validation: Optional[str] = None

# -------------------------- Clients --------------------------
llm = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
)
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# -------------------------- Data Model --------------------------
@dataclass
class Hit:
    score: float
    payload: dict

# -------------------------- Embeddings --------------------------
def embed(text: str) -> List[float]:
    resp = llm.embeddings.create(
        model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
        input=text
    )
    return resp.data[0].embedding

# -------------------------- Simple Heuristics (fallback) --------------------------
_WORD_RE = re.compile(r"[A-Za-z0-9\-\(\)\/\.]+")

def simple_tokens(s: str) -> List[str]:
    return [w.lower() for w in _WORD_RE.findall(s or "") if w.strip()]

def jaccard_like_overlap(q_tokens: List[str], text: str) -> float:
    t_tokens = set(simple_tokens(text))
    if not t_tokens:
        return 0.0
    q_set = set(q_tokens)
    inter = len(q_set & t_tokens)
    return inter / max(1, len(q_set))

def build_act_priors(query: str) -> List[Tuple[str, float]]:
    priors = []
    q = query.lower()
    if any(k in q for k in ["admissible", "certificate", "65b", "electronic record"]):
        priors.append((r"indian evidence act", 0.22))
    if any(k in q for k in ["intermediary", "safe-harbour", "69a", "79"]):
        priors.append((r"information technology act", 0.20))
    if any(k in q for k in ["arrest", "482", "fir quash"]):
        priors.append((r"code of criminal procedure", 0.18))
    if any(k in q for k in ["related party", "section 188", "board approval"]):
        priors.append((r"companies act", 0.16))
    if any(k in q for k in ["29a", "resolution applicant", "coc", "cirp"]):
        priors.append((r"insolvency and bankruptcy code", 0.16))
    if any(k in q for k in ["8(1)", "personal information", "pio"]):
        priors.append((r"right to information act", 0.16))
    return priors

def prior_boost_for_hit(priors: List[Tuple[str,float]], payload: dict) -> float:
    act = (payload or {}).get("doc_title", "") or ""
    boost = 0.0
    for pattern, val in priors:
        if re.search(pattern, act, flags=re.I):
            boost += val
    return min(boost, 0.35)

def gather_text_for_overlap(p: dict) -> str:
    parts = [
        p.get("doc_title",""),
        p.get("section_heading",""),
        p.get("section_number_norm") or p.get("section_number") or "",
        p.get("breadcrumbs",""),
        p.get("search_text",""),
    ]
    return " | ".join([x for x in parts if x])

def heuristic_rerank(query: str, hits: List[Hit], alpha=0.65, beta=0.25, gamma=0.10) -> List[Hit]:
    if not hits:
        return []
    q_tokens = simple_tokens(query)
    max_vec = max((h.score or 0.0) for h in hits) or 1.0
    priors = build_act_priors(query)
    scored = []
    for h in hits:
        vec_norm = (h.score or 0.0) / max_vec
        text_blob = gather_text_for_overlap(h.payload)
        overlap = jaccard_like_overlap(q_tokens, text_blob)
        pboost = prior_boost_for_hit(priors, h.payload)
        combined = alpha * vec_norm + beta * overlap + gamma * pboost
        scored.append((combined, h))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [h for _, h in scored]

# -------------------------- Search --------------------------
def qdrant_search(query_vec: List[float], top_k=15) -> List[Hit]:
    limit = max(15, top_k * 8)
    res = qdrant.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=query_vec,
        limit=limit,
    )
    return [Hit(score=(r.score or 0.0), payload=r.payload) for r in res]

# -------------------------- Layer Detection --------------------------
def detect_layer(p: Dict) -> str:
    # Honor explicit payload field if present
    for key in ("layer","level","chunk_level"):
        if key in p:
            val = str(p.get(key)).strip().upper()
            if val in {"L1","L2","L3"}:
                return val
    # Heuristic inference
    has_sec = bool(p.get("section_number") or p.get("section_number_norm"))
    has_clause = bool(p.get("clause") or p.get("sub_section") or re.search(r"\(\w+\)", (p.get("search_text") or "")))
    if has_clause:
        return "L3"
    if has_sec:
        return "L2"
    return "L1"

# -------------------------- Context Builder (Triple bucket) --------------------------
def split_context_by_layer(hits: List[Hit], max_chars=7500):
    l1, l2, l3 = [], [], []
    total = 0
    for h in hits:
        p = h.payload or {}
        act = p.get("doc_title")
        sec_no = p.get("section_number_norm") or p.get("section_number")
        sec_head = p.get("section_heading")
        crumbs = p.get("breadcrumbs")
        text = p.get("search_text") or ""
        meta = " | ".join([x for x in [act, f"Section {sec_no}" if sec_no else None, sec_head, crumbs] if x])
        block = f"[[META]] {meta}\n[[TEXT]] {text}\n"
        if total + len(block) > max_chars:
            break
        layer = detect_layer(p)
        if layer == "L3":
            l3.append(block)
        elif layer == "L2":
            l2.append(block)
        else:
            l1.append(block)
        total += len(block)
    return "\n---\n".join(l1), "\n---\n".join(l2), "\n---\n".join(l3)

# -------------------------- 1) RETRIEVER REWRITER PROMPT --------------------------
def rewrite_queries(user_query: str) -> List[str]:
    system_msg = (
        "You are a retrieval rewriter for the Advotac Legal AI system.\n\n"
        "Task:\nRewrite the user’s legal question into precise, statutory search queries for the Indian Central Acts dataset.\n\n"
        "Follow these rules:\n"
        "1. Extract key legal entities (Act name, section numbers, keywords like “penalty”, “benefit”, “definition”, etc.).\n"
        "2. Generate 3–5 short expanded queries targeting legal text retrieval.\n"
        "3. Prioritize semantic clarity + Indian law context.\n"
        "4. Avoid conversational or redundant phrases.\n\n"
        "Output strictly as JSON list, e.g.:\n"
        '["Section 5 conditions Hindu Marriage Act 1955", '
        '"Hindu Marriage Act Section 5 essential conditions", '
        '"Conditions for valid Hindu marriage under Indian law"]'
    )
    user_msg = user_query
    try:
        resp = llm.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,

            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ]
        )
        content = resp.choices[0].message.content.strip()
        # Strict JSON list expected
        queries = json.loads(content)
        if isinstance(queries, list) and all(isinstance(x, str) for x in queries):
            return queries[:5]
    except Exception:
        pass
    # Fallback: return the original query as a single-element list
    return [user_query]

# -------------------------- 2) LLM RERANKER PROMPT (with fallback) --------------------------
def llm_rerank(user_query: str, hits: List[Hit]) -> Optional[List[Tuple[float, Hit]]]:
    """
    Returns list of (score, Hit) sorted desc by score using LLM. If fails, returns None.
    """
    if not hits:
        return None

    # Prepare compact context items
    items = []
    for i, h in enumerate(hits[:24]):  # cap prompt size
        p = h.payload or {}
        layer = detect_layer(p)
        meta = [
            p.get("doc_title",""),
            f"Section {(p.get('section_number_norm') or p.get('section_number') or '')}".strip(),
            p.get("section_heading",""),
            p.get("breadcrumbs","")
        ]
        item = {
            "id": i,
            "layer": layer,
            "meta": " | ".join([x for x in meta if x]),
            "text": (p.get("search_text") or "")[:1200]
        }
        items.append(item)

    system_msg = (
        "You are a legal reranker.\n"
        "You are given retrieved context chunks from three hierarchical layers:\n"
        "- L1: Part/Chapter titles\n"
        "- L2: Sections (main provisions)\n"
        "- L3: Clauses/paragraphs (fine details)\n\n"
        "Goal: Rank them by legal relevance to the question.\n\n"
        "Rules:\n"
        "1. Prefer L3 chunks that contain direct answers or definitions.\n"
        "2. Use L2 chunks for supportive explanations or related sections.\n"
        "3. Use L1 only for hierarchical relevance.\n"
        "4. Penalize duplicates or context-only text without rules.\n"
        "5. Prioritize chunks that include:\n"
        "   - Explicit section numbers or clause references\n"
        "   - Legal verbs (e.g., “shall”, “may”, “liable”, “entitled”)\n\n"
        "Output:\nReturn ranked list with numeric relevance score 0–1 and short reason.\n\n"
        "Example Output:\n"
        '[\n  {"layer":"L3","id":0,"score":0.96,"reason":"Defines \\"supply\\" under Section 7 CGST"},\n'
        '  {"layer":"L2","id":3,"score":0.82,"reason":"Section text elaborating the same rule"},\n'
        '  {"layer":"L1","id":6,"score":0.55,"reason":"Heading context only"}\n]\n'
    )
    user_msg = "Question:\n" + user_query + "\n\nChunks:\n" + json.dumps(items, ensure_ascii=False)

    try:
        resp = llm.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,

            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ]
        )
        content = resp.choices[0].message.content.strip()
        ranked = json.loads(content)
        scored: List[Tuple[float, Hit]] = []
        for row in ranked:
            if isinstance(row, dict) and "id" in row and "score" in row:
                idx = int(row["id"])
                if 0 <= idx < len(items):
                    scored.append((float(row["score"]), hits[idx]))
        # sort by score desc
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored
    except Exception:
        return None

# -------------------------- 3) GENERATOR PROMPT (final synthesis) --------------------------
def generate_answer(user_query: str, l1_texts: str, l2_texts: str, l3_texts: str) -> str:
    system_msg = (
        "You are Advotac Legal AI, a precision-based assistant trained on Indian Acts (L1–L3 hierarchy).\n\n"
        "Use the retrieved context to answer accurately under Indian law.\n"
        "Prioritize exact statutory wording, clarity, and verified citations."
    )
    user_msg = f"""
Context:
L1 (Navigation): {l1_texts or "[none]"}
L2 (Sections): {l2_texts or "[none]"}
L3 (Clauses): {l3_texts or "[none]"}

Question: {user_query}

Instructions:
1. Accuracy is the highest priority. If the answer isn’t clearly found, say:
   "No directly relevant section found in the available Acts."
2. Quote exact legal text from L2/L3 where possible.
3. Always mention:
   - Section number & name
   - Act name & year
   - Sub-section or clause if applicable
4. Explain the rule in plain legal English.
5. Use this output format:

---
1️⃣ **Section & Act Name:**  
2️⃣ **Core Rule(s):**  
3️⃣ **Key Provisos / Exceptions / Definitions:**  
4️⃣ **Penalty / Procedure / Remedies:**  
5️⃣ **Drafting / Practical Notes:**  
6️⃣ **Final Citation (Act → Chapter → Section → Clause):**
---

Rules:
- Never invent law or cite outside retrieved Acts.
- If multiple Acts overlap, list them separately.
- Use concise statutory English; avoid speculation.
"""
    resp = llm.chat.completions.create(
        model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,

        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ]
    )
    return resp.choices[0].message.content.strip()

# -------------------------- 4) (Optional) CITATION VALIDATOR --------------------------
def validate_citations(answer_text: str, l1_texts: str, l2_texts: str, l3_texts: str) -> str:
    system_msg = (
        "You are a legal citation validator for Indian Acts.\n"
        "Input includes an answer text with citations.\n\n"
        "Task:\nCheck that every section, sub-section, and Act name mentioned exists in the retrieved context or in the official statute structure.\n\n"
        "Output:\n- “✅ Verified” if all match.\n- “⚠️ Possibly inaccurate” + suggest correct citation.\n\n"
        "Never modify meaning — only validate."
    )
    user_msg = f"""Answer:
{answer_text}

Retrieved Context:
L1: {l1_texts or "[none]"}
L2: {l2_texts or "[none]"}
L3: {l3_texts or "[none]"}"""

    try:
        resp = llm.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,

            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ]
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"(validator error: {e})"

# -------------------------- INTERNAL WEIGHTING --------------------------
LAYER_WEIGHTS = {"L1": 0.15, "L2": 0.55, "L3": 0.30}

def weighted_blend(hits_with_scores: List[Tuple[float, Hit]], top_k: int) -> List[Hit]:
    """
    Blend top results per layer proportionally by weights, preserving LLM score order.
    """
    if not hits_with_scores:
        return []
    per_layer: Dict[str, List[Hit]] = {"L1": [], "L2": [], "L3": []}
    for score, h in hits_with_scores:
        layer = detect_layer(h.payload or {})
        per_layer.setdefault(layer, []).append(h)

    total = max(1, top_k)
    l1n = max(0, int(round(total * LAYER_WEIGHTS["L1"])))
    l2n = max(0, int(round(total * LAYER_WEIGHTS["L2"])))
    l3n = max(0, total - l1n - l2n)

    # take in order within each bucket
    blended = per_layer["L3"][:l3n] + per_layer["L2"][:l2n] + per_layer["L1"][:l1n]
    # if short, fill from remaining in priority order L3->L2->L1
    for layer in ("L3","L2","L1"):
        if len(blended) >= total:
            break
        for h in per_layer[layer][(l3n if layer=="L3" else l2n if layer=="L2" else l1n):]:
            blended.append(h)
            if len(blended) >= total:
                break
    return blended[:total]

# -------------------------- Helpers --------------------------
def _hits_to_sources(hits: List[Hit]) -> List[Source]:
    return [Source.from_hit(hit) for hit in hits]

def _sanitize_query(query: str) -> str:
    return (query or "").strip()

# -------------------------- Public API --------------------------
def answer_query(
    query: str,
    top_k: int = 5,
    threshold: float = 0.70,
    do_validate: bool = True
) -> AnswerResponse:
    """
    Execute the full retrieval + generation pipeline and return a serializable response.
    """
    normalized_query = _sanitize_query(query)
    if not normalized_query:
        raise ValueError("Query must not be empty.")
    if top_k <= 0:
        raise ValueError("top_k must be greater than zero.")
    if not 0 <= threshold <= 1:
        raise ValueError("threshold must be between 0 and 1.")

    expanded = rewrite_queries(normalized_query)

    try:
        query_vector = embed(normalized_query)
    except Exception as exc:
        raise RuntimeError("Failed to create embedding for query.") from exc

    try:
        wide_hits = qdrant_search(query_vector, top_k=max(15, top_k * 8))
    except Exception as exc:
        raise RuntimeError("Vector search against Qdrant failed.") from exc

    final_hits: List[Hit]
    reranked_llm = llm_rerank(normalized_query, wide_hits)
    if reranked_llm:
        filtered = [(score, hit) for score, hit in reranked_llm if (hit.score or 0.0) >= threshold]
        base = filtered if filtered else reranked_llm
        final_hits = weighted_blend(base, top_k)
    else:
        heuristic_hits = heuristic_rerank(normalized_query, wide_hits)
        filtered = [hit for hit in heuristic_hits if (hit.score or 0.0) >= threshold]
        final_hits = filtered[:top_k] if filtered else heuristic_hits[:top_k]

    if not final_hits:
        return AnswerResponse(
            query=normalized_query,
            answer="No directly relevant section found in the available Acts.",
            expanded_queries=expanded,
            sources=_hits_to_sources(wide_hits[:top_k]),
            validation=None,
        )

    l1_texts, l2_texts, l3_texts = split_context_by_layer(final_hits)
    if not (l1_texts or l2_texts or l3_texts):
        return AnswerResponse(
            query=normalized_query,
            answer="No directly relevant section found in the available Acts.",
            expanded_queries=expanded,
            sources=_hits_to_sources(final_hits),
            validation=None,
        )

    answer_text = generate_answer(normalized_query, l1_texts, l2_texts, l3_texts)

    validation: Optional[str] = None
    if do_validate:
        validation = validate_citations(answer_text, l1_texts, l2_texts, l3_texts)

    return AnswerResponse(
        query=normalized_query,
        answer=answer_text,
        expanded_queries=expanded,
        sources=_hits_to_sources(final_hits),
        validation=validation,
    )
