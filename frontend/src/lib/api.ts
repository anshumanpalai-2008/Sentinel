import type {
  AgentSession,
  AnalyticsSummary,
  CreatePolicyDto,
  DailyRun,
  OutcomeDistribution,
  Policy,
  TokenTrend,
  ToolUsage,
} from './types'

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

// ─── Generic fetch helper ──────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Agent endpoints ───────────────────────────────────────────────────────

export async function startAgent(
  task: string
): Promise<{ session_id: string }> {
  return apiFetch('/api/agents/start', {
    method: 'POST',
    body: JSON.stringify({ task }),
  })
}

export async function getSessions(): Promise<AgentSession[]> {
  return apiFetch('/api/agents/sessions')
}

export async function getSession(id: string): Promise<AgentSession> {
  return apiFetch(`/api/agents/sessions/${id}`)
}

// ─── Policy endpoints ──────────────────────────────────────────────────────

export async function getPolicies(): Promise<Policy[]> {
  return apiFetch('/api/policies')
}

export async function createPolicy(data: CreatePolicyDto): Promise<Policy> {
  return apiFetch('/api/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function togglePolicy(
  id: string,
  active: boolean
): Promise<Policy> {
  return apiFetch(`/api/policies/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ active }),
  })
}

export async function deletePolicy(id: string): Promise<void> {
  await apiFetch(`/api/policies/${id}`, { method: 'DELETE' })
}

// ─── Analytics endpoint ────────────────────────────────────────────────────

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return apiFetch('/api/analytics')
}

// ─── Mock data (fallback when backend is offline) ─────────────────────────

export const MOCK_SESSIONS: AgentSession[] = [
  {
    id: 'sess_01j8x2k9m3n4p5q6r7s8t9u0',
    task: 'Write a REST API for a todo app in Python (FastAPI)',
    status: 'completed',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
    total_tokens: 14320,
    total_cost_usd: 0.043,
    model: 'gpt-4o',
    execution_steps: [],
  },
  {
    id: 'sess_02j9y3l0n4o5p6q7r8s9t0u1',
    task: 'Refactor authentication middleware for performance',
    status: 'blocked',
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    completed_at: new Date(Date.now() - 3600 * 1000 * 4.5).toISOString(),
    total_tokens: 8754,
    total_cost_usd: 0.026,
    model: 'gpt-4o',
    execution_steps: [],
  },
  {
    id: 'sess_03k0z4m1o5p6q7r8s9t0u1v2',
    task: 'Debug failing pytest suite in data pipeline',
    status: 'completed',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    completed_at: new Date(Date.now() - 3600 * 1000 * 23.5).toISOString(),
    total_tokens: 22100,
    total_cost_usd: 0.066,
    model: 'gpt-4o',
    execution_steps: [],
  },
  {
    id: 'sess_04l1a5n2p6q7r8s9t0u1v2w3',
    task: 'Create a data analysis pipeline with Pandas',
    status: 'failed',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    completed_at: new Date(Date.now() - 3600 * 1000 * 47).toISOString(),
    total_tokens: 5320,
    total_cost_usd: 0.016,
    model: 'gpt-4o-mini',
    execution_steps: [],
  },
  {
    id: 'sess_05m2b6o3q7r8s9t0u1v2w3x4',
    task: 'Generate OpenAPI documentation from codebase',
    status: 'completed',
    created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    completed_at: new Date(Date.now() - 3600 * 1000 * 71).toISOString(),
    total_tokens: 18900,
    total_cost_usd: 0.057,
    model: 'gpt-4o',
    execution_steps: [],
  },
]

export const MOCK_POLICIES: Policy[] = [
  {
    id: 'pol_01',
    name: 'No File Deletion',
    description: 'Prevent the agent from deleting any files on the filesystem.',
    rule: 'BLOCK if tool_name == "bash" and ("rm -rf" in args or "os.remove" in args)',
    active: true,
    created_at: new Date(Date.now() - 86400 * 1000 * 7).toISOString(),
  },
  {
    id: 'pol_02',
    name: 'No Network Egress',
    description:
      'Block outbound HTTP calls that are not to approved internal endpoints.',
    rule: 'BLOCK if tool_name == "http_request" and domain not in APPROVED_DOMAINS',
    active: true,
    created_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
  },
  {
    id: 'pol_03',
    name: 'Secret Masking',
    description:
      'Intercept and mask any API keys or tokens that appear in agent output.',
    rule: 'INTERCEPT if output matches /sk-[a-zA-Z0-9]{32,}/ or /Bearer [a-zA-Z0-9]{20,}/',
    active: true,
    created_at: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
  },
  {
    id: 'pol_04',
    name: 'Read-Only DB',
    description: 'Allow only SELECT queries; block INSERT/UPDATE/DELETE.',
    rule: 'BLOCK if tool_name == "sql_query" and query.strip().upper().startswith(("INSERT","UPDATE","DELETE","DROP"))',
    active: false,
    created_at: new Date(Date.now() - 86400 * 1000 * 1).toISOString(),
  },
]

const sevenDaysAgo = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return d.toISOString().slice(0, 10)
})

export const MOCK_ANALYTICS: AnalyticsSummary = {
  total_runs: 247,
  success_rate: 78.5,
  avg_cost_usd: 0.038,
  active_policies: 3,
  daily_runs: sevenDaysAgo.map((date, i) => ({
    date,
    runs: [18, 24, 31, 27, 42, 38, 67][i],
    success: [14, 20, 24, 21, 34, 30, 54][i],
    failed: [2, 2, 4, 3, 5, 4, 6][i],
    blocked: [2, 2, 3, 3, 3, 4, 7][i],
  })) as DailyRun[],
  token_trend: sevenDaysAgo.map((date, i) => ({
    date,
    avg_tokens: [9400, 11200, 10800, 12500, 13100, 11900, 14320][i],
    avg_cost_usd: [0.028, 0.034, 0.032, 0.037, 0.039, 0.036, 0.043][i],
  })) as TokenTrend[],
  outcome_distribution: [
    { name: 'Success', value: 194, color: '#22c55e' },
    { name: 'Blocked', value: 31, color: '#f59e0b' },
    { name: 'Failed', value: 22, color: '#ef4444' },
  ] as OutcomeDistribution[],
  top_tools: [
    { tool: 'bash', count: 312 },
    { tool: 'read_file', count: 287 },
    { tool: 'write_file', count: 198 },
    { tool: 'http_request', count: 143 },
    { tool: 'sql_query', count: 97 },
  ] as ToolUsage[],
}

export const MOCK_STEPS = [
  {
    id: 's1',
    session_id: 'demo',
    step_index: 0,
    step_type: 'reasoning' as const,
    content:
      'Analyzing the task: Build a REST API with FastAPI. I need to create the main application file, define models, and set up routes.',
    status: 'success' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 340,
  },
  {
    id: 's2',
    session_id: 'demo',
    step_index: 1,
    step_type: 'tool_call' as const,
    content: 'read_file("./requirements.txt")',
    tool_name: 'read_file',
    status: 'success' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 85,
  },
  {
    id: 's3',
    session_id: 'demo',
    step_index: 2,
    step_type: 'tool_result' as const,
    content: 'fastapi==0.111.0\nuvicorn==0.30.0\nsqlalchemy==2.0.31\n...',
    status: 'success' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 23,
  },
  {
    id: 's4',
    session_id: 'demo',
    step_index: 3,
    step_type: 'tool_call' as const,
    content: 'write_file("main.py", <FastAPI app code>)',
    tool_name: 'write_file',
    status: 'success' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 112,
  },
  {
    id: 's5',
    session_id: 'demo',
    step_index: 4,
    step_type: 'policy_intercept' as const,
    content:
      'POLICY BLOCK: Attempted to make outbound HTTP request to external API (api.openai.com). Blocked by "No Network Egress" policy.',
    status: 'blocked' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 8,
  },
  {
    id: 's6',
    session_id: 'demo',
    step_index: 5,
    step_type: 'correction' as const,
    content:
      'Adjusting approach: Will use mock data instead of external API call to comply with network egress policy.',
    status: 'corrected' as const,
    timestamp: new Date().toISOString(),
    latency_ms: 290,
  },
]
