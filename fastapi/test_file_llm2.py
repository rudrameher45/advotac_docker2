"""
Quick smoke test for the Advotac v2 assistant API.

Run this script after starting the FastAPI server:
    uvicorn fastapi.main:app --reload --port 8000

Then execute:
    python3 fastapi/test_file_llm2.py --query "What is Section 10 of the Evidence Act?"

Set ADVOTAC_V2_ENDPOINT to target a different deployment endpoint if needed.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict

import requests

DEFAULT_ENDPOINT = os.getenv(
    "ADVOTAC_V2_ENDPOINT",
    "http://localhost:8000/api/assistant/query-v2",
)


def invoke_api(
    endpoint: str,
    query: str,
    top_k: int,
    threshold: float,
    validate: bool,
) -> Dict[str, Any]:
    """Call the FastAPI endpoint and return the parsed JSON payload."""
    payload = {
        "query": query,
        "top_k": top_k,
        "threshold": threshold,
        "validate": validate,
    }
    response = requests.post(endpoint, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()


def parse_args(argv: Any = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Invoke the Advotac v2 assistant API")
    parser.add_argument(
        "--endpoint",
        default=DEFAULT_ENDPOINT,
        help=f"Full URL of the API endpoint (default: {DEFAULT_ENDPOINT})",
    )
    parser.add_argument(
        "--query",
        required=True,
        help="User query text to send to the assistant.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        dest="top_k",
        help="Number of chunks to blend in the response (default: 5).",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.70,
        help="Similarity/score threshold to keep retrieved chunks (default: 0.70).",
    )
    parser.add_argument(
        "--no-validate",
        dest="validate",
        action="store_false",
        help="Disable citation validation for the response.",
    )
    parser.set_defaults(validate=True)
    return parser.parse_args(argv)


def main(argv: Any = None) -> int:
    args = parse_args(argv)
    print(f"▶ Sending query to {args.endpoint}")
    try:
        payload = invoke_api(
            endpoint=args.endpoint,
            query=args.query,
            top_k=args.top_k,
            threshold=args.threshold,
            validate=args.validate,
        )
    except requests.HTTPError as exc:
        print("✗ Server returned an error:", file=sys.stderr)
        if exc.response is not None:
            print(f"  Status: {exc.response.status_code}", file=sys.stderr)
            try:
                print(f"  Detail: {exc.response.json()}", file=sys.stderr)
            except ValueError:
                print(f"  Detail: {exc.response.text}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"✗ Failed to reach endpoint: {exc}", file=sys.stderr)
        return 1

    print("✓ Response received:\n")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
