import base64
import binascii
import time
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services import analysis_llm, answer_llm, answer_llm2
from services.answer_llm import AnswerResponse as AnswerResponseV1
from services.answer_llm2 import AnswerResponse as AnswerResponseV2
from services.analysis_llm import AnalysisResult
from database import (
    get_db,
    log_assistant_history,
    log_general_task_history,
    UserDB,
    AssistantHistoryDB,
    GeneralTaskHistoryDB,
    get_general_task_by_token,
    get_general_history_for_user,
    ensure_credit_available,
    spend_credits_for_task,
    InsufficientCreditsError,
    get_credit_balance,
)
from models import (
    GeneralTaskRecord,
    GeneralResponsePayload,
    GeneralSource,
    HistoryEntry,
)

router = APIRouter(prefix="/assistant", tags=["assistant"])


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    threshold: Optional[float] = 0.70
    validate: Optional[bool] = True
    task_name: Optional[str] = "General"
    user_id: Optional[str] = None
    user_email: Optional[str] = None


class GeneralHistoryCreate(BaseModel):
    token: str
    query: str
    response: AnswerResponseV2
    task_name: Optional[str] = "General"
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    created_at: Optional[datetime] = None


class CreditBalanceResponse(BaseModel):
    credits: int
    last_update_time: datetime


class AnalysisRequest(BaseModel):
    text: Optional[str] = None
    pdf_base64: Optional[str] = None
    instructions: Optional[str] = None
    top_points: Optional[int] = 5


def _build_general_response(payload: dict) -> GeneralResponsePayload:
    if not isinstance(payload, dict):
        payload = {}
    return GeneralResponsePayload.model_validate(
        {
            "query": payload.get("query") or "",
            "answer": payload.get("answer") or "",
            "expanded_queries": payload.get("expanded_queries") or [],
            "sources": payload.get("sources") or [],
            "validation": payload.get("validation"),
        }
    )


def _db_record_to_general_task_record(record: GeneralTaskHistoryDB) -> GeneralTaskRecord:
    response_payload = record.response_payload or {}
    response = _build_general_response(response_payload)
    return GeneralTaskRecord(
        id=record.id,
        user_id=record.user_id,
        token=record.token,
        task_name=record.task_name,
        query=record.query,
        answer=record.answer,
        created_at=record.created_at,
        response=response,
    )


def _resolve_user_id(db: Session, user_id: Optional[str], user_email: Optional[str]) -> Optional[str]:
    """Return canonical user id using either explicit id or fallback to email lookup."""
    if user_id:
        exists = db.query(UserDB.id).filter(UserDB.id == user_id).first()
        if exists:
            return user_id
    if user_email:
        match = db.query(UserDB.id).filter(UserDB.email == user_email).first()
        if match:
            return match[0] if isinstance(match, tuple) else match.id
    return None


@router.post("/query", response_model=AnswerResponseV1)
async def run_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Run the Advotac legal assistant pipeline and return a structured response.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    top_k = request.top_k if request.top_k is not None else 5
    threshold = request.threshold if request.threshold is not None else 0.70
    do_validate = request.validate if request.validate is not None else True
    task_name = request.task_name or "Answer"

    try:
        start_time = time.perf_counter()
        result = await run_in_threadpool(
            answer_llm.answer_query,
            request.query,
            top_k=top_k,
            threshold=threshold,
            do_validate=do_validate,
        )
        response_time_ms = int((time.perf_counter() - start_time) * 1000)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"LLM pipeline error: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {exc}") from exc

    if not result:
        raise HTTPException(status_code=204, detail="No answer generated.")

    canonical_user_id = _resolve_user_id(db, request.user_id, request.user_email)
    if canonical_user_id:
        try:
            log_assistant_history(
                db,
                user_id=canonical_user_id,
                task_name=task_name,
                question=request.query,
                answer=result.answer,
                response_time_ms=response_time_ms,
            )
        except Exception:
            # History persistence should not block the response; already logged inside helper.
            pass

    return result


@router.post("/analysis", response_model=AnalysisResult)
async def analyse_document(request: AnalysisRequest) -> AnalysisResult:
    """
    Analyse either plain text or a base64-encoded PDF and return a structured summary.
    """
    max_points = request.top_points if (request.top_points and request.top_points > 0) else 5

    instructions = (request.instructions or "").strip()
    has_pdf = bool(request.pdf_base64)

    if not has_pdf and request.text and request.text.strip():
        text = request.text.strip()
        return await run_in_threadpool(
            analysis_llm.analyse_text,
            text,
            max_tokens=analysis_llm.MAX_INPUT_TOKENS,
            max_points=max_points,
            source="text",
        )

    if request.pdf_base64:
        try:
            pdf_bytes = base64.b64decode(request.pdf_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Invalid base64-encoded PDF content.") from exc

        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Decoded PDF content is empty.")

        result = await run_in_threadpool(
            analysis_llm.analyse_pdf,
            pdf_bytes,
            instructions=instructions or (request.text.strip() if request.text and request.text.strip() else None),
            max_tokens=analysis_llm.MAX_INPUT_TOKENS,
            max_points=max_points,
        )
        return result

    raise HTTPException(status_code=400, detail="Provide either 'text' or 'pdf_base64' in the request body.")


@router.post("/query-v2", response_model=AnswerResponseV2)
async def run_query_v2(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Run the Advotac multi-collection v2 pipeline and return a structured response.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    top_k = request.top_k if request.top_k is not None else 5
    threshold = request.threshold if request.threshold is not None else 0.70
    do_validate = request.validate if request.validate is not None else True
    task_name = request.task_name or "General"

    credit_cost: Optional[int] = None
    canonical_user_id = _resolve_user_id(db, request.user_id, request.user_email)
    if canonical_user_id and (task_name.lower() == "general"):
        try:
            credit_cost = ensure_credit_available(db, canonical_user_id, task_name)
        except InsufficientCreditsError as exc:
            raise HTTPException(status_code=402, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Unable to verify credit balance.") from exc

    try:
        start_time = time.perf_counter()
        result = await run_in_threadpool(
            answer_llm2.answer_query,
            request.query,
            top_k=top_k,
            threshold=threshold,
            validate=do_validate,
        )
        response_time_ms = int((time.perf_counter() - start_time) * 1000)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"LLM pipeline error: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {exc}") from exc

    if not result:
        raise HTTPException(status_code=204, detail="No answer generated.")

    if canonical_user_id and (task_name.lower() == "general"):
        try:
            spend_credits_for_task(db, canonical_user_id, task_name, cost=credit_cost)
        except InsufficientCreditsError as exc:
            raise HTTPException(status_code=402, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Failed to update credit balance.") from exc

    if canonical_user_id:
        try:
            log_assistant_history(
                db,
                user_id=canonical_user_id,
                task_name=task_name,
                question=request.query,
                answer=result.answer,
                response_time_ms=response_time_ms,
            )
        except Exception:
            pass

    return result


@router.post("/general-history", response_model=GeneralTaskRecord)
async def create_general_history_entry(request: GeneralHistoryCreate, db: Session = Depends(get_db)):
    """
    Persist a general assistant task result so it can appear in history tables.
    """
    if not request.token.strip():
        raise HTTPException(status_code=400, detail="Token is required.")

    canonical_user_id = _resolve_user_id(db, request.user_id, request.user_email)
    if not canonical_user_id:
        raise HTTPException(status_code=404, detail="User not found.")

    payload_dict = request.response.model_dump()
    created_at = request.created_at or datetime.utcnow()

    existing = (
        db.query(GeneralTaskHistoryDB)
        .filter(GeneralTaskHistoryDB.token == request.token.strip())
        .first()
    )

    if existing:
        existing.user_id = canonical_user_id
        existing.task_name = request.task_name or existing.task_name
        existing.query = request.query
        existing.answer = request.response.answer
        existing.response_payload = payload_dict
        existing.created_at = created_at
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = log_general_task_history(
            db,
            user_id=canonical_user_id,
            token=request.token,
            task_name=request.task_name or "General",
            query=request.query,
            answer=request.response.answer,
            response_payload=payload_dict,
            created_at=created_at,
        )

    return _db_record_to_general_task_record(record)


@router.get("/general-history/{token}", response_model=GeneralTaskRecord)
async def get_general_history_entry(
    token: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve a persisted general assistant task result by token for the authenticated user.
    """
    if not user_id and not user_email:
        raise HTTPException(status_code=400, detail="Provide either user_id or user_email.")

    record = get_general_task_by_token(db, token.strip())
    if not record:
        raise HTTPException(status_code=404, detail="General task not found.")

    canonical_user_id = _resolve_user_id(db, user_id, user_email)
    if not canonical_user_id or canonical_user_id != record.user_id:
        raise HTTPException(status_code=404, detail="General task not found for this user.")

    return _db_record_to_general_task_record(record)


@router.get("/history", response_model=List[HistoryEntry])
async def get_history(
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Retrieve stored assistant responses for the authenticated user.
    """
    if limit <= 0:
        raise HTTPException(status_code=400, detail="limit must be a positive integer.")

    if not user_id and not user_email:
        raise HTTPException(status_code=400, detail="Provide either user_id or user_email.")

    canonical_user_id = _resolve_user_id(db, user_id, user_email)
    if not canonical_user_id:
        raise HTTPException(status_code=404, detail="User not found.")

    records = (
        db.query(AssistantHistoryDB)
        .filter(AssistantHistoryDB.user_id == canonical_user_id)
        .order_by(AssistantHistoryDB.created_at.desc())
        .limit(limit)
        .all()
    )

    general_records = get_general_history_for_user(db, canonical_user_id, limit)

    combined: List[HistoryEntry] = []

    for record in records:
        combined.append(
            HistoryEntry(
                id=record.id,
                entry_type="analysis",
                user_id=record.user_id,
                task_name=record.task_name,
                question=record.question,
                answer=record.answer,
                created_at=record.created_at,
                response_time_ms=record.response_time_ms,
            )
        )

    for record in general_records:
        combined.append(
            HistoryEntry(
                id=record.id,
                entry_type="general",
                user_id=record.user_id,
                task_name=record.task_name,
                question=record.query,
                answer=record.answer,
                created_at=record.created_at,
                token=record.token,
            )
        )

    combined.sort(key=lambda entry: entry.created_at, reverse=True)

    return combined[:limit]


@router.get("/credits", response_model=CreditBalanceResponse)
async def get_credit_balance_endpoint(
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve the current credit balance for the authenticated user.
    """
    if not user_id and not user_email:
        raise HTTPException(status_code=400, detail="Provide either user_id or user_email.")

    canonical_user_id = _resolve_user_id(db, user_id, user_email)
    if not canonical_user_id:
        raise HTTPException(status_code=404, detail="User not found.")

    try:
        balance = get_credit_balance(db, canonical_user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to retrieve credit balance.") from exc

    return CreditBalanceResponse(
        credits=balance.credit,
        last_update_time=balance.last_update_time,
    )
