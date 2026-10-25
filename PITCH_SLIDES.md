# 📊 SENTINEL: Pitch Deck & Presentation Slides

---

## Slide 1: Title & Hook
### **SENTINEL**
#### *The Mission Control Center for Autonomous AI Agents*
- **Subtitle:** In-Flight Observability, Policy Enforcement & Orchestration
- **Tech Stack:** Google Antigravity CLI (`agy`) • Failproof AI • FastAPI • Next.js 14
- **Presenter:** Anshuman Palai

---

## Slide 2: The Problem
### **Why Autonomous Agents Fail in Production**
- **The "Quiet Failure" Epidemic:** Unlike traditional bugs, agents fail smoothly — generating plausible excuses or hallucinating success.
- **Runaway & Dangerous Actions:** Agents can get stuck in infinite execution loops or attempt dangerous shell commands (deleting files, modifying root paths).
- **Post-Mortem Logging is Too Late:** By the time traditional loggers record an issue, the file has been corrupted or the API cost has spiked.

---

## Slide 3: The Solution
### **Introducing SENTINEL**
- **The Brain:** **Antigravity CLI (`agy`)** powered by Gemini 3.8 Flash for high-speed coding and autonomous execution.
- **The Immune System:** **Failproof AI** integrated as an *in-flight guardrail* that intercepts dangerous tool actions before they run.
- **The Cockpit:** A real-time mission-control dashboard rendering live execution graphs over WebSockets.

---

## Slide 4: Deep Dive — How We Use Failproof AI
### **Active In-Flight Interception vs. Passive Logging**
1. **Tool-Call Interception:** Every shell command or file write is routed through Failproof's policy engine before hitting disk.
2. **Policy Enforcement:**
   - Blocks unauthorized root writes (`/etc`, `/usr`).
   - Prevents unapproved destructive commands (`rm`, `unlink`).
   - Rate-limits repeating failure loops.
3. **Autonomous Self-Correction:** When blocked, Failproof injects corrective feedback into the agent's context window so it recovers on its own.

---

## Slide 5: System Architecture
```
[User Task] ──> [Next.js Dashboard]
                      │
                      ▼ (WebSocket / REST)
              [FastAPI Orchestrator]
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
 [Antigravity CLI: agy]   [Failproof AI Engine]
 (Autonomous Execution)    (In-Flight Guardrails)
```
- Real-time DAG node generation via **ReactFlow**.
- Sub-second bi-directional WebSocket streaming.

---

## Slide 6: Live Demo Highlight
### **The "Live Interception" Moment**
- Agent attempts to write a configuration file to `/etc/passwd`.
- **Failproof intercepts the call mid-flight:**
  - Status turns red/orange on the live graph.
  - Policy alert triggers on the dashboard.
  - Injected correction prompts agent to write to `./config/` instead.
- Agent successfully completes the task without crashing!

---

## Slide 7: Business Value & Scalability
- **Security:** Enterprise-grade policy compliance for autonomous coding tools.
- **Cost Reduction:** Prevents runaway agent loops and token consumption spikes.
- **Observability:** Instant latency percentiles ($p_{50}, p_{95}$), token accounting, and session replays.

---

## Slide 8: The Vision & Future Roadmap
- Human-in-the-loop one-click approvals for flagged actions.
- Multi-agent coordination graphs with delegated subagents.
- Automated regression test suites generated from historical Failproof incident traces.
