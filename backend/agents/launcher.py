"""AsyncAgentLauncher — spawns `agy` or falls back to a rich mock simulation."""

import asyncio
import shutil
import uuid
import random
from datetime import datetime, timezone
from typing import AsyncGenerator

from db.models import ExecutionStep, StepType, StepStatus


# ---------------------------------------------------------------------------
# Parse helpers
# ---------------------------------------------------------------------------

def _classify_line(line: str) -> StepType | None:
    """Return a StepType for a raw agy output line, or None to skip."""
    l = line.strip()
    if not l:
        return None
    lower = l.lower()
    if l.startswith(">") or lower.startswith("thinking:") or lower.startswith("reasoning:"):
        return StepType.reasoning
    if lower.startswith("tool:") or lower.startswith("running:") or lower.startswith("calling:"):
        return StepType.tool_call
    if lower.startswith("result:") or lower.startswith("output:") or lower.startswith("returned:"):
        return StepType.tool_result
    if "✓" in l or lower.startswith("done") or lower.startswith("complete") or lower.startswith("finished"):
        return StepType.reasoning  # completion note kept as reasoning
    return None


def _extract_tool_name(line: str) -> str | None:
    for prefix in ("Tool:", "Running:", "Calling:"):
        if line.strip().startswith(prefix):
            rest = line.strip()[len(prefix):].strip()
            return rest.split("(")[0].strip() or None
    return None


# ---------------------------------------------------------------------------
# Mock simulation data
# ---------------------------------------------------------------------------

_MOCK_STEPS: list[dict] = [
    {
        "step_type": StepType.reasoning,
        "content": "> Analyzing the task requirements and forming an execution plan…",
        "tool_name": None,
        "latency_ms": 320,
    },
    {
        "step_type": StepType.reasoning,
        "content": "thinking: I need to first read the project structure to understand the codebase layout.",
        "tool_name": None,
        "latency_ms": 210,
    },
    {
        "step_type": StepType.tool_call,
        "content": "Tool: read_file(path='./src/main.py')",
        "tool_name": "read_file",
        "latency_ms": 85,
    },
    {
        "step_type": StepType.tool_result,
        "content": "Result: Read 342 lines from ./src/main.py — found FastAPI app with 6 routes.",
        "tool_name": None,
        "latency_ms": 40,
    },
    {
        "step_type": StepType.reasoning,
        "content": "> Identified 3 potential improvement areas: error handling, response schemas, and missing auth middleware.",
        "tool_name": None,
        "latency_ms": 450,
    },
    {
        "step_type": StepType.tool_call,
        "content": "Tool: run_command(cmd='grep -r TODO ./src')",
        "tool_name": "run_command",
        "latency_ms": 120,
    },
    {
        "step_type": StepType.tool_result,
        "content": "Result: Found 7 TODO comments across 4 files.",
        "tool_name": None,
        "latency_ms": 60,
    },
    {
        "step_type": StepType.tool_call,
        "content": "Tool: write_file(path='/etc/passwd', content='...')",
        "tool_name": "write_file",
        "latency_ms": 30,
        "_triggers_policy": True,
    },
    {
        "step_type": StepType.tool_call,
        "content": "Tool: read_file(path='./src/utils.py')",
        "tool_name": "read_file",
        "latency_ms": 75,
    },
    {
        "step_type": StepType.tool_result,
        "content": "Result: Read 87 lines from ./src/utils.py — utility functions look clean.",
        "tool_name": None,
        "latency_ms": 35,
    },
    {
        "step_type": StepType.tool_call,
        "content": "Tool: write_file(path='./src/main.py', content='<improved code with auth middleware>')",
        "tool_name": "write_file",
        "latency_ms": 150,
    },
    {
        "step_type": StepType.tool_result,
        "content": "Result: Successfully wrote 389 lines to ./src/main.py.",
        "tool_name": None,
        "latency_ms": 50,
    },
    {
        "step_type": StepType.reasoning,
        "content": "✓ Task complete. Applied auth middleware, improved error handling, and addressed 5 of 7 TODOs.",
        "tool_name": None,
        "latency_ms": 200,
    },
]


# ---------------------------------------------------------------------------
# Launcher
# ---------------------------------------------------------------------------

class AsyncAgentLauncher:
    """
    Spawns `agy` as a subprocess and streams structured ExecutionStep objects.
    Falls back to a rich mock simulation if `agy` is not found.
    """

    def __init__(self, task: str, session_id: str):
        self.task = task
        self.session_id = session_id
        self._process: asyncio.subprocess.Process | None = None

    async def run(self) -> AsyncGenerator[ExecutionStep, None]:
        agy_path = shutil.which("agy")
        if agy_path:
            async for step in self._run_real(agy_path):
                yield step
        else:
            async for step in self._run_mock():
                yield step

    # ------------------------------------------------------------------
    # Real agy subprocess
    # ------------------------------------------------------------------

    async def _run_real(self, agy_path: str) -> AsyncGenerator[ExecutionStep, None]:
        self._process = await asyncio.create_subprocess_exec(
            agy_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        # Send task via stdin
        if self._process.stdin:
            self._process.stdin.write((self.task + "\n").encode())
            await self._process.stdin.drain()
            self._process.stdin.close()

        step_index = 0
        try:
            async for raw_line in self._process.stdout:
                line = raw_line.decode(errors="replace").rstrip()
                step_type = _classify_line(line)
                if step_type is None:
                    continue

                step = ExecutionStep(
                    id=str(uuid.uuid4()),
                    session_id=self.session_id,
                    step_index=step_index,
                    step_type=step_type,
                    content=line,
                    tool_name=_extract_tool_name(line) if step_type == StepType.tool_call else None,
                    status=StepStatus.success,
                    timestamp=datetime.now(timezone.utc),
                )
                step_index += 1
                yield step
        finally:
            if self._process and self._process.returncode is None:
                try:
                    self._process.terminate()
                    await asyncio.wait_for(self._process.wait(), timeout=5.0)
                except Exception:
                    self._process.kill()

    # ------------------------------------------------------------------
    # Mock simulation (used when agy not available)
    # ------------------------------------------------------------------

    async def _run_mock(self) -> AsyncGenerator[ExecutionStep, None]:
        step_index = 0
        for mock in _MOCK_STEPS:
            # Simulate realistic processing delay
            await asyncio.sleep(random.uniform(0.3, 0.9))

            step = ExecutionStep(
                id=str(uuid.uuid4()),
                session_id=self.session_id,
                step_index=step_index,
                step_type=mock["step_type"],
                content=mock["content"],
                tool_name=mock.get("tool_name"),
                status=StepStatus.success,
                timestamp=datetime.now(timezone.utc),
                latency_ms=mock.get("latency_ms"),
            )
            step_index += 1
            yield step

    async def cancel(self) -> None:
        """Terminate the subprocess if running."""
        if self._process and self._process.returncode is None:
            try:
                self._process.terminate()
                await asyncio.wait_for(self._process.wait(), timeout=5.0)
            except Exception:
                self._process.kill()
