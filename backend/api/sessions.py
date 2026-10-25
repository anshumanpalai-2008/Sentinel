"""REST API router for agent sessions."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.database import get_db
from db.models import AgentSession, ExecutionStep, SessionStatus, StepType, StepStatus

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------


class ExecutionStepOut(BaseModel):
    id: str
    session_id: str
    step_index: int
    step_type: str
    content: str
    tool_name: str | None
    status: str
    timestamp: datetime
    latency_ms: int | None

    model_config = {"from_attributes": True}


class AgentSessionOut(BaseModel):
    id: str
    task: str
    status: str
    created_at: datetime
    completed_at: datetime | None
    total_tokens: int
    total_cost_usd: float
    model: str

    model_config = {"from_attributes": True}


class AgentSessionDetail(AgentSessionOut):
    steps: list[ExecutionStepOut] = []


class PaginatedSessions(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AgentSessionOut]


class AnalyticsSummary(BaseModel):
    total_runs: int
    completed: int
    failed: int
    blocked: int
    running: int
    success_rate: float
    avg_tokens: float
    avg_cost_usd: float
    total_cost_usd: float
    most_common_failures: list[dict]
    policy_intercepts_total: int


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/analytics/summary", response_model=AnalyticsSummary)
async def analytics_summary(db: Annotated[AsyncSession, Depends(get_db)]):
    """Aggregate statistics across all sessions."""
    result = await db.execute(
        select(
            func.count(AgentSession.id).label("total"),
            func.sum(case((AgentSession.status == SessionStatus.completed, 1), else_=0)).label("completed"),
            func.sum(case((AgentSession.status == SessionStatus.failed, 1), else_=0)).label("failed"),
            func.sum(case((AgentSession.status == SessionStatus.blocked, 1), else_=0)).label("blocked"),
            func.sum(case((AgentSession.status == SessionStatus.running, 1), else_=0)).label("running"),
            func.avg(AgentSession.total_tokens).label("avg_tokens"),
            func.avg(AgentSession.total_cost_usd).label("avg_cost"),
            func.sum(AgentSession.total_cost_usd).label("total_cost"),
        )
    )
    row = result.one()
    total = row.total or 0
    completed = row.completed or 0
    failed = row.failed or 0
    blocked = row.blocked or 0
    running = row.running or 0

    # Policy intercepts
    pi_result = await db.execute(
        select(func.count(ExecutionStep.id)).where(
            ExecutionStep.step_type == StepType.policy_intercept
        )
    )
    policy_intercepts = pi_result.scalar() or 0

    # Most common failures (tool calls that were blocked)
    fail_result = await db.execute(
        select(ExecutionStep.tool_name, func.count(ExecutionStep.id).label("cnt"))
        .where(ExecutionStep.status == StepStatus.blocked, ExecutionStep.tool_name.isnot(None))
        .group_by(ExecutionStep.tool_name)
        .order_by(func.count(ExecutionStep.id).desc())
        .limit(5)
    )
    failures = [{"tool_name": r.tool_name, "count": r.cnt} for r in fail_result.all()]

    success_rate = (completed / total * 100) if total > 0 else 0.0

    return AnalyticsSummary(
        total_runs=total,
        completed=completed,
        failed=failed,
        blocked=blocked,
        running=running,
        success_rate=round(success_rate, 2),
        avg_tokens=round(row.avg_tokens or 0, 2),
        avg_cost_usd=round(row.avg_cost or 0, 6),
        total_cost_usd=round(row.total_cost or 0, 6),
        most_common_failures=failures,
        policy_intercepts_total=policy_intercepts,
    )


@router.get("/", response_model=PaginatedSessions)
async def list_sessions(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """List all sessions with optional status filter and pagination."""
    query = select(AgentSession).order_by(AgentSession.created_at.desc())
    count_query = select(func.count(AgentSession.id))

    if status:
        try:
            status_enum = SessionStatus(status)
            query = query.where(AgentSession.status == status_enum)
            count_query = count_query.where(AgentSession.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    sessions = result.scalars().all()

    return PaginatedSessions(
        total=total,
        page=page,
        page_size=page_size,
        items=[AgentSessionOut.model_validate(s) for s in sessions],
    )


@router.get("/{session_id}", response_model=AgentSessionDetail)
async def get_session(session_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    """Get a session with all its execution steps."""
    result = await db.execute(
        select(AgentSession)
        .options(selectinload(AgentSession.steps))
        .where(AgentSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return AgentSessionDetail(
        **AgentSessionOut.model_validate(session).model_dump(),
        steps=[ExecutionStepOut.model_validate(s) for s in session.steps],
    )


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    """Delete a session and all its steps."""
    result = await db.execute(select(AgentSession).where(AgentSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()


@router.get("/{session_id}/replay", response_model=list[ExecutionStepOut])
async def replay_session(session_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    """Return all steps in chronological order for replay."""
    result = await db.execute(
        select(AgentSession).where(AgentSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    steps_result = await db.execute(
        select(ExecutionStep)
        .where(ExecutionStep.session_id == session_id)
        .order_by(ExecutionStep.step_index, ExecutionStep.timestamp)
    )
    steps = steps_result.scalars().all()
    return [ExecutionStepOut.model_validate(s) for s in steps]
