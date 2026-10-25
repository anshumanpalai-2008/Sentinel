"""FailproofTracer — policy enforcement layer wrapping agent execution steps."""

import asyncio
import uuid
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

import httpx

from db.models import ExecutionStep, StepType, StepStatus, Policy

logger = logging.getLogger("sentinel.tracing")

FAILPROOFAI_URL = "http://localhost:8020"


# ---------------------------------------------------------------------------
# Default policy rules (matched against tool_call content)
# ---------------------------------------------------------------------------

_BUILTIN_RULES = [
    {
        "name": "No file deletion",
        "match_keywords": ["rm ", "delete", "unlink", "remove_file", "shutil.rmtree"],
    },
    {
        "name": "Restricted paths",
        "match_keywords": ["/etc/", "/usr/", "/sys/", "/boot/", "/root/"],
    },
    {
        "name": "Rate limit loops",
        # Handled via call-count tracking in check_policies
        "match_keywords": [],
    },
    {
        "name": "No network in sandbox",
        "match_keywords": ["http://", "https://", "requests.get", "httpx.get", "curl ", "wget "],
    },
]


class FailproofTracer:
    """
    Wraps an AsyncGenerator of ExecutionStep objects and enforces policies.

    Usage::

        tracer = FailproofTracer(policies)
        async for step in tracer.wrap(launcher.run()):
            ...
    """

    def __init__(self, policies: list[Policy]):
        self.policies = [p for p in policies if p.active]
        self._tool_call_counts: dict[str, int] = {}  # tool_name → consecutive count
        self._last_tool: str | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_policies(self, step: ExecutionStep) -> tuple[bool, str | None]:
        """
        Returns (allowed: bool, reason: str | None).
        `reason` is set when the step is blocked.
        """
        if step.step_type != StepType.tool_call:
            return True, None

        content_lower = step.content.lower()
        tool_name = step.tool_name or ""

        for policy in self.policies:
            rule_lower = policy.rule.lower()

            # Keyword match against content or rule
            for builtin in _BUILTIN_RULES:
                if builtin["name"] == policy.name:
                    for kw in builtin["match_keywords"]:
                        if kw in content_lower:
                            return False, f"Policy '{policy.name}': detected '{kw}' in tool call"

            # Rate-limit: same tool called >5 consecutive times
            if policy.name == "Rate limit loops" and policy.active:
                if tool_name == self._last_tool:
                    self._tool_call_counts[tool_name] = self._tool_call_counts.get(tool_name, 1) + 1
                    if self._tool_call_counts[tool_name] > 5:
                        return False, f"Policy 'Rate limit loops': tool '{tool_name}' called {self._tool_call_counts[tool_name]} consecutive times"
                else:
                    self._tool_call_counts = {}

            # Generic keyword match from policy.rule itself
            for word in rule_lower.split():
                if len(word) > 3 and word in content_lower:
                    return False, f"Policy '{policy.name}': matched rule keyword '{word}'"

        # Update call tracking
        if tool_name:
            if tool_name != self._last_tool:
                self._tool_call_counts = {tool_name: 1}
            self._last_tool = tool_name

        return True, None

    async def wrap(
        self,
        source: AsyncGenerator[ExecutionStep, None],
    ) -> AsyncGenerator[ExecutionStep, None]:
        """Yields steps from source, inserting policy_intercept steps on violations."""
        async for step in source:
            allowed, reason = self.check_policies(step)

            if not allowed:
                # Mark the original step as blocked
                step.status = StepStatus.blocked

                # Yield the blocked step
                yield step

                # Yield a policy_intercept step
                intercept = ExecutionStep(
                    id=str(uuid.uuid4()),
                    session_id=step.session_id,
                    step_index=step.step_index,
                    step_type=StepType.policy_intercept,
                    content=f"🚨 POLICY INTERCEPT: {reason}. Step blocked and agent redirected.",
                    tool_name=step.tool_name,
                    status=StepStatus.blocked,
                    timestamp=datetime.now(timezone.utc),
                    latency_ms=1,
                )
                yield intercept

                # Yield a correction step
                correction = ExecutionStep(
                    id=str(uuid.uuid4()),
                    session_id=step.session_id,
                    step_index=step.step_index,
                    step_type=StepType.correction,
                    content=(
                        f"↩ Correction applied: Agent instructed to avoid restricted operation. "
                        f"Resuming with safe alternative path. [{reason}]"
                    ),
                    tool_name=None,
                    status=StepStatus.corrected,
                    timestamp=datetime.now(timezone.utc),
                    latency_ms=5,
                )
                yield correction
            else:
                yield step

    async def get_traces(self) -> list[dict]:
        """Fetch traces from the failproofai local dashboard API (localhost:8020)."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{FAILPROOFAI_URL}/api/traces")
                resp.raise_for_status()
                return resp.json()
        except httpx.ConnectError:
            logger.debug("failproofai not reachable at %s — skipping traces", FAILPROOFAI_URL)
            return []
        except Exception as exc:
            logger.warning("Failed to fetch failproofai traces: %s", exc)
            return []
