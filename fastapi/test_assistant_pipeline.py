"""
Ad-hoc test runner for the Advotac assistant pipeline.

Usage (from repo root):
    PYTHONPATH=fastapi python3 fastapi/test_assistant_pipeline.py \
        --query "What is Section 185 under the Companies Act?"

Environment variables used:
    TEST_QUERY            (optional) default query text
    TEST_TOP_K            (optional) override top_k integer
    TEST_THRESHOLD        (optional) override threshold float
    TEST_VALIDATE         (optional) "true"/"false" to toggle citation validator
"""

import argparse
import json
import os
import sys
from typing import Optional


def _bool_from_env(value: Optional[str], default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def main() -> int:
    # Delayed import so we can show better errors when deps are missing.
    try:
        from services.answer_llm import answer_query  # type: ignore
    except ModuleNotFoundError as exc:
        missing = exc.name or "dependency"
        print(
            f"✗ Missing Python dependency '{missing}'. "
            "Install FastAPI requirements before running this test.\n"
            "Example:\n"
            "    PYTHONPATH=fastapi python3 -m pip install -r fastapi/requirements.txt",
            file=sys.stderr,
        )
        return 1

    parser = argparse.ArgumentParser(description="Run a one-off assistant query")
    parser.add_argument(
        "--query",
        default=os.getenv("TEST_QUERY", "").strip(),
        help="Legal query to test (defaults to TEST_QUERY env or built-in example)",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=int(os.getenv("TEST_TOP_K", "5")),
        help="Number of chunks to blend in the final context",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=float(os.getenv("TEST_THRESHOLD", "0.70")),
        help="Similarity threshold applied to retrieval scores",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        default=_bool_from_env(os.getenv("TEST_VALIDATE"), True),
        help="Force-enable citation validator (default: env/True)",
    )
    parser.add_argument(
        "--no-validate",
        dest="validate",
        action="store_false",
        help="Disable citation validator",
    )

    args = parser.parse_args()

    query = args.query or "What is Section 185 under the Companies Act 2013?"
    print(f"▶ Running assistant query:\n    {query}\n")

    try:
        response = answer_query(
            query=query,
            top_k=args.top_k,
            threshold=args.threshold,
            do_validate=args.validate,
        )
    except Exception as exc:  # pragma: no cover - surface full error to console
        print("✗ Pipeline execution failed:", exc, file=sys.stderr)
        return 1

    print("✓ Response:")
    print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
