"""REST API router for policies."""

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Policy

router = APIRouter(prefix="/api/policies", tags=["policies"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class PolicyOut(BaseModel):
    id: str
    name: str
    description: str
    rule: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PolicyCreate(BaseModel):
    name: str
    description: str
    rule: str
    active: bool = True


class PolicyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rule: str | None = None
    active: bool | None = None


# ---------------------------------------------------------------------------
# Default policies seeded at startup
# ---------------------------------------------------------------------------

DEFAULT_POLICIES = [
    {
        "name": "No file deletion",
        "description": "Prevents the agent from deleting any files on the filesystem.",
        "rule": "block tool calls containing: rm, delete, unlink, remove_file, shutil.rmtree",
        "active": True,
    },
    {
        "name": "Restricted paths",
        "description": "Prevents writes to sensitive system directories.",
        "rule": "block writes to /etc/, /usr/, /sys/, /boot/, /root/",
        "active": True,
    },
    {
        "name": "Rate limit loops",
        "description": "Blocks an agent that calls the same tool more than 5 consecutive times.",
        "rule": "block same tool called more than 5 consecutive times",
        "active": True,
    },
    {
        "name": "No network in sandbox",
        "description": "Prevents external HTTP/HTTPS calls from within the sandboxed agent.",
        "rule": "block external http calls: http://, https://, requests.get, httpx.get, curl, wget",
        "active": True,
    },
]


async def seed_default_policies(db: AsyncSession) -> None:
    """Insert default policies if none exist yet."""
    result = await db.execute(select(Policy))
    existing = result.scalars().all()
    existing_names = {p.name for p in existing}

    for pol in DEFAULT_POLICIES:
        if pol["name"] not in existing_names:
            db.add(Policy(
                id=str(uuid.uuid4()),
                name=pol["name"],
                description=pol["description"],
                rule=pol["rule"],
                active=pol["active"],
                created_at=datetime.now(timezone.utc),
            ))
    await db.commit()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[PolicyOut])
async def list_policies(db: Annotated[AsyncSession, Depends(get_db)]):
    """List all policies."""
    result = await db.execute(select(Policy).order_by(Policy.created_at))
    policies = result.scalars().all()
    return [PolicyOut.model_validate(p) for p in policies]


@router.post("/", response_model=PolicyOut, status_code=201)
async def create_policy(body: PolicyCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    """Create a new policy."""
    policy = Policy(
        id=str(uuid.uuid4()),
        name=body.name,
        description=body.description,
        rule=body.rule,
        active=body.active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return PolicyOut.model_validate(policy)


@router.put("/{policy_id}", response_model=PolicyOut)
async def update_policy(
    policy_id: str,
    body: PolicyUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a policy (toggle active, change rule, etc.)."""
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if body.name is not None:
        policy.name = body.name
    if body.description is not None:
        policy.description = body.description
    if body.rule is not None:
        policy.rule = body.rule
    if body.active is not None:
        policy.active = body.active

    await db.commit()
    await db.refresh(policy)
    return PolicyOut.model_validate(policy)


@router.delete("/{policy_id}", status_code=204)
async def delete_policy(policy_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    """Delete a policy."""
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    await db.delete(policy)
    await db.commit()
