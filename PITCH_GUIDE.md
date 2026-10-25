# 🎙️ How to Pitch & Explain SENTINEL

> Use this exact structure for hackathon judges, interviewers, or portfolio reviews.

---

## 1. The 30-Second Elevator Pitch

> *"Autonomous AI coding agents are incredibly powerful, but in production they fail quietly or run rogue because traditional software testing can't catch hallucinated commands or unauthorized actions.*
>
> *I built **SENTINEL** — a real-time Command & Control platform for autonomous AI agents. It bridges Google's **Antigravity CLI (`agy`)** as the reasoning and execution brain with **Failproof AI** as an active, in-flight runtime policy interceptor. Developers can spawn agents, watch their reasoning and tool execution graph build live over WebSockets, and see security policies catch and self-correct risky actions before anything breaks."*

---

## 2. The 3-Minute Live Demo Script

Follow these steps while sharing your screen:

### Step 1: The Mission Control Overview (30s)
- **Show:** The Dashboard at `http://localhost:3000`.
- **Say:** *"Here is Mission Control. We see real-time metrics across our agent fleet: total runs, success rates, token expenses, and active security guardrails."*

### Step 2: Launching an Agent (30s)
- **Show:** Click **"New Agent"** (`/agents/new`) and select or type a prompt (e.g., *"Write a REST API and perform system configuration"*).
- **Say:** *"When I dispatch this task, Sentinel communicates with our FastAPI backend to spawn an autonomous `agy` process in a sandboxed runtime."*

### Step 3: The "Wow" Interception Moment (60s)
- **Show:** The live split view (`/agents/[sessionId]`).
- **Say:** *"On the left, we have a live terminal feed streaming reasoning and tool calls over WebSockets. On the right, ReactFlow dynamically renders the execution graph."*
- **Point to the screen when a node turns orange/red:**
  *"Notice right here: the agent attempted to modify a restricted system file. Instead of crashing or letting the command execute, **Failproof AI caught the call mid-flight**, blocked the action, and injected corrective context back into the agent's context window. The agent immediately self-corrected and chose a secure path."*

### Step 4: Guardrails & Observability (60s)
- **Show:** The **Policies** tab (`/policies`) and **Analytics** tab (`/analytics`).
- **Say:** *"Teams can configure guardrails without code — like blocking file deletions, rate-limiting repeated tool loops, or sandboxing network traffic. In Analytics, we get full auditability over tokens, p95 latencies, and tool costs."*

---

## 3. High-Value Interview Q&A

### Q: "What was the technical challenge you solved?"
> **Answer:** *"Handling bidirectional real-time state. Traditional AI observability is passive — you look at logs after the agent has already crashed or deleted data. With Sentinel, we implemented an in-flight interception proxy between the agent subprocess and system tools. By streaming output chunk-by-chunk through WebSockets and synchronizing state with a dynamic ReactFlow graph, the developer has millisecond-level transparency and control."*

### Q: "How do `agy` and `Failproof AI` actually fit together?"
> **Answer:** 
> - *"`agy` (Antigravity CLI) provides the autonomous execution loop, code intelligence, and shell tool interaction."*
> - *"Failproof AI provides the policy engine and deterministic guardrails."*
> - *"Sentinel is the orchestration and presentation layer that connects them into an enterprise-ready dashboard."*

### Q: "What would you build next?"
> **Answer:** *"Multi-agent orchestration where subagents can negotiate tasks, human-in-the-loop manual approval gates for flagged actions, and automated regression testing from past failed sessions."*
