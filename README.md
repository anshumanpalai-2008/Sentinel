# 🛰️ SENTINEL — AI Agent Command & Control Platform

**Sentinel** is an AI agent observability, tracing, and policy-enforcement command center integrating **Antigravity CLI (`agy`)** and **Failproof AI**.

---

## 🌟 Key Features
- **Live Terminal & Execution Graph**: Spawns `agy` agents and visualizes reasoning, tool calls, and results in real time.
- **Failproof Runtime Policy Enforcement**: Intercepts unauthorized/risky tool calls (e.g. `write_file /etc/passwd`, file deletion) mid-flight, halts bad actions, and injects self-healing context.
- **Session History & Replay**: Inspect past agent traces, latencies, tokens, and decisions.
- **Policy Management**: Configure and toggle real-time guardrails directly from the dashboard.
- **Analytics**: Observability into agent costs, tokens, execution outcomes, and latency.

---

## 🚀 Quickstart Guide

### 1. Start the Backend (FastAPI + WebSockets)

```bash
cd /Users/anshumanpalai/.gemini/antigravity/scratch/sentinel/backend

# Install Python requirements
pip3 install -r requirements.txt --prefer-binary

# Run server
uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

### 2. Start the Frontend (Next.js 14 App Router)

```bash
cd /Users/anshumanpalai/.gemini/antigravity/scratch/sentinel/frontend

# Install node dependencies
npm install

# Start Next.js development server
npm run dev
```
- Dashboard: `http://localhost:3000`

---

## 🏗️ Architecture

```
User Prompt (Next.js Frontend)
       │
       ▼
FastAPI Backend (POST /api/agents/start)
       │
       ▼
Subprocess / Sandbox: Antigravity CLI (`agy`)
       │
       ▼ (Every reasoning step & tool call)
Failproof AI Interceptor (Runtime Policies)
   ├── ✅ Allowed -> Executes tool & streams to UI
   └── ❌ Blocked -> Emits Policy Alert, prompts agent self-correction
       │
       ▼
WebSocket (`ws://localhost:8000/ws/agents/{id}`)
       ├── Live Terminal Feed
       └── Real-Time ReactFlow Execution Graph
```
