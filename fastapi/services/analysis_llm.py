"""
Utility functions for running lightweight document analysis with Azure OpenAI.

The module centralises all LLM-related helpers that are specific to the
document analysis workflow so the FastAPI layer can stay thin.
"""

from __future__ import annotations

import io
import json
import os
import re
import textwrap
from typing import List, Optional, Tuple

from openai import AzureOpenAI
from pydantic import BaseModel
from PyPDF2 import PdfReader

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", "gpt-4o-mini")

MAX_INPUT_TOKENS = 6000
MAX_OUTPUT_TOKENS = 1500
AVG_CHARS_PER_TOKEN = 4  # heuristic used to keep inputs within Azure limits


class AnalysisResult(BaseModel):
    """Structured output returned to the API layer."""

    source: str
    summary: str
    analysis: str
    key_points: List[str]
    keywords: List[str]
    comparisons: List[str]
    table_markdown: Optional[str] = None
    truncated: bool
    input_characters: int


def _approximate_token_count(text: str) -> int:
    """Rough estimate of token usage based on average 4 chars per token."""
    return max(1, len(text) // AVG_CHARS_PER_TOKEN)


def _truncate_to_token_limit(text: str, max_tokens: int) -> Tuple[str, bool]:
    """Trim the input text so it stays within the permitted token budget."""
    if not text:
        return "", False
    char_limit = max_tokens * AVG_CHARS_PER_TOKEN
    if len(text) <= char_limit:
        return text, False
    return text[:char_limit], True


def _clean_text(text: str) -> str:
    """Normalize whitespace and strip non-printable characters before analysis."""
    if not text:
        return ""
    sanitized = text.replace("\u00a0", " ")
    sanitized = "".join(ch for ch in sanitized if ch.isprintable() or ch in "\n\r\t")
    sanitized = re.sub(r"[ \t]+", " ", sanitized)
    sanitized = re.sub(r"\r\n?", "\n", sanitized)
    sanitized = re.sub(r"\n{3,}", "\n\n", sanitized)
    return sanitized.strip()


def _init_llm() -> Optional[AzureOpenAI]:
    """Create a reusable Azure OpenAI client if credentials are available."""
    if not AZURE_OPENAI_API_KEY or not AZURE_OPENAI_ENDPOINT:
        return None
    try:
        return AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
        )
    except Exception:
        # Fall back to deterministic analysis if the SDK cannot be initialised.
        return None


_llm_client = _init_llm()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract raw text from a PDF byte stream.

    PyPDF2 handles text-only PDFs well enough for the initial release. We keep
    the implementation defensive so malformed files do not crash the API.
    """
    if not pdf_bytes:
        return ""

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception:
        return ""

    pieces: List[str] = []
    for page in reader.pages:
        try:
            content = page.extract_text() or ""
        except Exception:
            content = ""
        if content:
            pieces.append(content.strip())
    combined = "\n\n".join(pieces).strip()
    return _clean_text(combined)


def _basic_summary(text: str, max_points: int) -> Tuple[str, str, List[str], List[str], List[str], Optional[str]]:
    """
    Fallback summarisation when Azure OpenAI is unavailable.

    We take the leading sentences for the summary and reuse the first few
    sentences as key points so the caller receives consistent structure.
    """
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return "", "", [], [], [], None

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    summary_sentences = sentences[:4]
    summary = " ".join(summary_sentences)
    analysis_paragraphs = sentences[: min(len(sentences), 8)]
    analysis = " ".join(analysis_paragraphs)

    key_points = [s.strip() for s in sentences[:max_points] if s.strip()]
    seen_keywords = set()
    keywords: List[str] = []
    for word in summary.split():
        cleaned = word.strip(" ,.;:").lower()
        if cleaned and cleaned not in seen_keywords:
            seen_keywords.add(cleaned)
            keywords.append(cleaned)
        if len(keywords) >= max_points + 3:
            break
    comparisons = []
    table = None
    return summary.strip(), analysis.strip(), key_points, keywords, comparisons, table


def _call_llm(text: str, max_points: int) -> Optional[Tuple[str, List[str]]]:
    """Send the analysis prompt to Azure OpenAI when credentials are configured."""
    if not _llm_client:
        return None

    prompt = (
        "You are an India law assistant. Analyse the provided legal text and respond ONLY with JSON. "
        "Focus on Indian statutes, case law, or legal principles when relevant. "
        "Return an object with the following keys:\n"
        "- summary: 2 concise paragraphs (>= 4 sentences total) capturing the matter.\n"
        "- analysis: detailed multi-paragraph passage (~180-250 words) explaining legal significance, statutory hooks, and implications.\n"
        f"- key_points: array of {max_points} or fewer concise bullet strings covering crucial takeaways.\n"
        "- keywords: array of 5-8 short legal keywords or phrases from the text.\n"
        "- comparisons: array of up to 3 bullet strings comparing the facts with precedents, statutes, or contrasting outcomes.\n"
        "- table_markdown: optional GitHub-flavoured markdown table comparing parties/charges/findings (omit or use empty string if not useful).\n"
        "Ensure the JSON is valid, with strings trimmed; do not include code fences or additional commentary."
    )

    try:
        response = _llm_client.chat.completions.create(
            model=AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,
            temperature=0.2,
            max_tokens=MAX_OUTPUT_TOKENS,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text},
            ],
        )
    except Exception:
        return None

    try:
        content = response.choices[0].message.content if response.choices else ""
    except (AttributeError, IndexError):
        content = ""
    if not content:
        return None

    content = content.strip()
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        # LLM occasionally responds with triple-backtick code fences; strip and retry.
        cleaned = content.strip("` \n")
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        try:
            payload = json.loads(cleaned)
        except json.JSONDecodeError:
            return None

    summary = str(payload.get("summary", "")).strip()
    analysis = str(payload.get("analysis", "")).strip()
    raw_points = payload.get("key_points") or []
    raw_keywords = payload.get("keywords") or []
    raw_comparisons = payload.get("comparisons") or []
    table_markdown = payload.get("table_markdown")
    points: List[str] = []
    if isinstance(raw_points, list):
        for item in raw_points[:max_points]:
            if isinstance(item, str) and item.strip():
                points.append(item.strip())
    keywords: List[str] = []
    if isinstance(raw_keywords, list):
        for item in raw_keywords:
            if isinstance(item, str) and item.strip():
                keywords.append(item.strip())
    comparisons: List[str] = []
    if isinstance(raw_comparisons, list):
        for item in raw_comparisons[:3]:
            if isinstance(item, str) and item.strip():
                comparisons.append(item.strip())
    if isinstance(table_markdown, str):
        table_markdown = table_markdown.strip() or None
    else:
        table_markdown = None

    return summary, analysis, points, keywords, comparisons, table_markdown


def analyse_text(
    text: str,
    *,
    max_tokens: int = MAX_INPUT_TOKENS,
    max_points: int = 5,
    source: str = "text",
) -> AnalysisResult:
    """
    Run document analysis on the provided text and return a structured payload.
    """
    if not text or not text.strip():
        return AnalysisResult(
            source=source,
            summary="",
            analysis="",
            key_points=[],
            keywords=[],
            comparisons=[],
            table_markdown=None,
            truncated=False,
            input_characters=0,
        )

    normalized = _clean_text(text)
    trimmed_text, truncated = _truncate_to_token_limit(normalized, max_tokens)

    llm_result = _call_llm(trimmed_text, max_points)
    if llm_result:
        summary, analysis, key_points, keywords, comparisons, table_markdown = llm_result
    else:
        summary, analysis, key_points, keywords, comparisons, table_markdown = _basic_summary(
            trimmed_text, max_points
        )

    if not summary:
        summary = textwrap.shorten(trimmed_text, width=600, placeholder="…")
    if not analysis:
        analysis = summary

    return AnalysisResult(
        source=source,
        summary=summary,
        analysis=analysis,
        key_points=key_points,
        keywords=keywords,
        comparisons=comparisons,
        table_markdown=table_markdown,
        truncated=truncated,
        input_characters=len(trimmed_text),
    )


def analyse_pdf(
    pdf_bytes: bytes,
    *,
    instructions: Optional[str] = None,
    max_tokens: int = MAX_INPUT_TOKENS,
    max_points: int = 5,
) -> AnalysisResult:
    """Extract text from a PDF and delegate to the core text analysis."""
    text = extract_text_from_pdf(pdf_bytes)
    if instructions and instructions.strip():
        combined = _clean_text(f"User instructions:\n{instructions.strip()}\n\nDocument:\n{text}")
    else:
        combined = text
    return analyse_text(
        combined,
        max_tokens=max_tokens,
        max_points=max_points,
        source="pdf",
    )


__all__ = [
    "AnalysisResult",
    "MAX_OUTPUT_TOKENS",
    "analyse_pdf",
    "analyse_text",
    "extract_text_from_pdf",
    "MAX_INPUT_TOKENS",
]
