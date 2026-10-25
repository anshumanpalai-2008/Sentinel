"""SQLAlchemy ORM models for SENTINEL."""

import uuid
import enum
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base, engine


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class SessionStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    blocked = "blocked"


class StepType(str, enum.Enum):
    reasoning = "reasoning"
    tool_call = "tool_call"
    tool_result = "tool_result"
    policy_intercept = "policy_intercept"
    correction = "correction"


class StepStatus(str, enum.Enum):
    success = "success"
    blocked = "blocked"
    corrected = "corrected"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus), default=SessionStatus.pending, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    model: Mapped[str] = mapped_column(String(128), default="gemini-flash", nullable=False)
    execution_steps: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)

    steps: Mapped[list["ExecutionStep"]] = relationship(
        "ExecutionStep",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ExecutionStep.step_index",
    )


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rule: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class ExecutionStep(Base):
    __tablename__ = "execution_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False
    )
    step_index: Mapped[int] = mapped_column(Integer, nullable=False)
    step_type: Mapped[StepType] = mapped_column(SAEnum(StepType), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[StepStatus] = mapped_column(
        SAEnum(StepStatus), default=StepStatus.success, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    session: Mapped["AgentSession"] = relationship("AgentSession", back_populates="steps")


# ---------------------------------------------------------------------------
# DB Init
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
