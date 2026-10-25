"""SENTINEL — AI Agent Command & Control Platform — FastAPI backend entry point."""

import uuid
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import AsyncSessionLocal
from db.models import init_db, AgentSession, ExecutionStep, Policy, SessionStatus, StepStatus
from agents.launcher import AsyncAgentLauncher
from tracing.failproof import FailproofTracer
from api.sessions import router as sessions_router
from api.policies import router as policies_router, seed_default_policies

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinel")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SENTINEL starting up — initialising DB…")
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_default_policies(db)
    logger.info("SENTINEL ready.")
    yield
    logger.info("SENTINEL shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


app = FastAPI(
    title="SENTINEL",
    description="AI Agent Command & Control Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(policies_router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ---------------------------------------------------------------------------
# Start agent
# ---------------------------------------------------------------------------


class StartAgentRequest(BaseModel):
    task: str
    model: str = "gemini-flash"


class StartAgentResponse(BaseModel):
    session_id: str


@app.post("/api/agents/start", response_model=StartAgentResponse, tags=["agents"])
async def start_agent(body: StartAgentRequest):
    """Create an AgentSession record and return the session_id for WebSocket connection."""
    session_id = str(uuid.uuid4())
    async with AsyncSessionLocal() as db:
        session = AgentSession(
            id=session_id,
            task=body.task,
            model=body.model,
            status=SessionStatus.pending,
            created_at=datetime.now(timezone.utc),
        )
        db.add(session)
        await db.commit()

    logger.info("Created session %s for task: %s", session_id, body.task[:80])
    return StartAgentResponse(session_id=session_id)


# ---------------------------------------------------------------------------
# WebSocket — agent streaming
# ---------------------------------------------------------------------------


@app.websocket("/ws/agents/{session_id}")
async def agent_websocket(websocket: WebSocket, session_id: str):
    """
    Streams live agent execution steps over WebSocket.

    Message types sent to client:
      { "type": "step",         "data": <ExecutionStep> }
      { "type": "policy_alert", "data": { "step": <ExecutionStep> } }
      { "type": "complete",     "data": { "session_id": str, "total_steps": int } }
      { "type": "error",        "data": { "message": str } }
    """
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AgentSession).where(AgentSession.id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            await websocket.send_json({"type": "error", "data": {"message": "Session not found"}})
            await websocket.close(code=4004)
            return

        task = session.task

        # Mark as running
        session.status = SessionStatus.running
        await db.commit()

    # Load active policies
    async with AsyncSessionLocal() as db:
        pol_result = await db.execute(select(Policy).where(Policy.active == True))
        policies = pol_result.scalars().all()

    launcher = AsyncAgentLauncher(task=task, session_id=session_id)
    tracer = FailproofTracer(policies=policies)

    total_steps = 0
    total_tokens = 0
    total_cost = 0.0
    final_status = SessionStatus.completed

    try:
        raw_stream = launcher.run()
        async for step in tracer.wrap(raw_stream):
            total_steps += 1

            # Estimate token/cost (mock: ~50 tokens per step, $0.000002/token)
            step_tokens = len(step.content.split()) * 2
            step_cost = step_tokens * 0.000002
            total_tokens += step_tokens
            total_cost += step_cost

            # Persist step
            async with AsyncSessionLocal() as db:
                db.add(step)
                await db.commit()

            # Determine message type
            if step.step_type.value == "policy_intercept":
                await websocket.send_json({
                    "type": "policy_alert",
                    "data": {
                        "step": _step_to_dict(step),
                    },
                })
                final_status = SessionStatus.blocked
            else:
                await websocket.send_json({
                    "type": "step",
                    "data": _step_to_dict(step),
                })

    except WebSocketDisconnect:
        logger.info("Client disconnected from session %s", session_id)
        final_status = SessionStatus.failed
        await launcher.cancel()

    except Exception as exc:
        logger.exception("Error in agent session %s: %s", session_id, exc)
        final_status = SessionStatus.failed
        try:
            await websocket.send_json({
                "type": "error",
                "data": {"message": str(exc)},
            })
        except Exception:
            pass

    finally:
        # Update session record
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AgentSession).where(AgentSession.id == session_id))
            session = result.scalar_one_or_none()
            if session:
                # Only mark completed if it was blocked (policy) but otherwise finished
                if final_status == SessionStatus.blocked and total_steps > 0:
                    session.status = SessionStatus.completed  # ran, just had a policy intercept
                else:
                    session.status = final_status
                session.completed_at = datetime.now(timezone.utc)
                session.total_tokens = total_tokens
                session.total_cost_usd = total_cost
                await db.commit()

        # Send completion message
        try:
            await websocket.send_json({
                "type": "complete",
                "data": {"session_id": session_id, "total_steps": total_steps},
            })
            await websocket.close()
        except Exception:
            pass

    logger.info("Session %s completed: %d steps, %d tokens, $%.6f", session_id, total_steps, total_tokens, total_cost)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _step_to_dict(step: ExecutionStep) -> dict:
    return {
        "id": step.id,
        "session_id": step.session_id,
        "step_index": step.step_index,
        "step_type": step.step_type.value if hasattr(step.step_type, "value") else step.step_type,
        "content": step.content,
        "tool_name": step.tool_name,
        "status": step.status.value if hasattr(step.status, "value") else step.status,
        "timestamp": step.timestamp.isoformat() if step.timestamp else None,
        "latency_ms": step.latency_ms,
    }
