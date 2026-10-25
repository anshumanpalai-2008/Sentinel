# 📘 SENTINEL: Comprehensive Step-by-Step Technical Documentation

---

## 1. Executive Summary & Core Value Proposition
**SENTINEL** is a mission-control command and control (C2) observability and runtime-enforcement platform for autonomous AI coding agents. It bridges Google's **Antigravity CLI (`agy`)** as the autonomous execution and reasoning engine with **Failproof AI** as an active mid-flight policy enforcement and tracing layer.

---

## 2. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 14 Frontend                    │
│      Dashboard • ReactFlow Graph • Live Streaming Terminal   │
└──────────────────────────────▲──────────────────────────────┘
                               │  Bidirectional WebSockets + JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                      FastAPI Backend Engine                 │
│  Session Store (SQLite) • Orchestrator • Analytics Engine   │
└───────────────┬─────────────────────────────▲───────────────┘
                │ Subprocess I/O              │ In-Flight Hook
┌───────────────▼──────────────┐ ┌────────────┴───────────────┐
│     Antigravity CLI (`agy`)  │ │        Failproof AI         │
│  Gemini 3.8 Flash • Agents   │ │ Tracing & Runtime Policies │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Deep Dive: How Failproof AI is Used in SENTINEL

Failproof AI is **not** treated as a passive post-run log viewer. Instead, it is integrated as an **active, in-flight runtime proxy**:

### A. Pre-Execution Interception (The Guardrail Layer)
Every candidate action (`tool_call`) emitted by `agy` passes through Failproof's policy engine before hitting disk or network:
1. **Tool Inspection**: Identifies tool name and payload arguments (e.g., `write_file` to `/etc/passwd` or `rm -rf`).
2. **Policy Verification**: Evaluates active rules:
   - *Restricted Paths*: Protects critical directories (`/etc`, `/usr`, `/sys`).
   - *Destructive File Ops*: Blocks unapproved deletion calls (`rm`, `unlink`).
   - *Infinite Loop / Rate Limit*: Intercepts repeating the same failing tool $>5$ times.
   - *Sandbox Egress*: Prevents outbound network calls in sandboxed profiles.

### B. In-Flight Remediation (Self-Healing Loop)
When a policy triggers:
1. The tool call is **denied and aborted** *before execution*.
2. Sentinel records a `policy_intercept` event in the execution trace.
3. A corrective context prompt is dynamically formulated (e.g., *"Access to /etc/passwd denied by Failproof Policy. Use safe path ./data/ output directory"*).
4. The correction is injected back into the agent context window, allowing `agy` to pivot and complete the task safely without human intervention.

### C. Fleet Tracing & Local Observability
- Interfaces with the local Failproof daemon (`localhost:8020`) and cloud fleet telemetry.
- Records sequential step latencies ($p_{50}, p_{95}$), token footprints, and decision chains.

---

## 4. Complete Step-by-Step Execution Lifecycle

### Step 1: Task Initialization
- The user inputs a prompt in Next.js (`/agents/new`).
- Next.js issues `POST /api/agents/start` to FastAPI.
- FastAPI initializes an `AgentSession` record in SQLite and returns a `session_id`.

### Step 2: Agent Spawning & Subprocess Isolation
- FastAPI's `AsyncAgentLauncher` initializes `agy` as a non-blocking asynchronous subprocess (`asyncio.create_subprocess_exec`).
- Input prompts are piped via `stdin`. Output streams (`stdout`/`stderr`) are read line-by-line.

### Step 3: Stream Parsing & Event Classification
- The backend parses streaming output in real-time using pattern recognition:
  - `reasoning`: Agent thinking blocks and intermediate planning.
  - `tool_call`: Intent to run shell commands or mutate files.
  - `tool_result`: Output returned by executed tools.
  - `completion`: Final deliverable or confirmation.

### Step 4: Live WebSocket Broadcasting
- The client connects to `ws://localhost:8000/ws/agents/{session_id}`.
- Every event is pushed immediately to the client as a typed JSON frame.

### Step 5: Real-Time Visualization
- **Left Panel (Terminal)**: Renders color-coded, monospace stream logs.
- **Right Panel (ReactFlow)**: Dynamically constructs directed acyclic graph (DAG) nodes:
  - Blue: Tool calls
  - Green: Successful completions
  - Red/Orange: Policy alerts & active remediations
