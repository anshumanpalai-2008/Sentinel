// ─── Step & Session types ──────────────────────────────────────────────────

export type StepType =
  | 'reasoning'
  | 'tool_call'
  | 'tool_result'
  | 'policy_intercept'
  | 'correction'

export type StepStatus = 'success' | 'blocked' | 'corrected' | 'running'

export type SessionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked'

export interface ExecutionStep {
  id: string
  session_id: string
  step_index: number
  step_type: StepType
  content: string
  tool_name?: string
  status: StepStatus
  timestamp: string
  latency_ms?: number
}

export interface AgentSession {
  id: string
  task: string
  status: SessionStatus
  created_at: string
  completed_at?: string
  total_tokens: number
  total_cost_usd: number
  model: string
  execution_steps: ExecutionStep[]
}

// ─── Policy types ──────────────────────────────────────────────────────────

export interface Policy {
  id: string
  name: string
  description: string
  rule: string
  active: boolean
  created_at: string
}

export interface CreatePolicyDto {
  name: string
  description: string
  rule: string
  active?: boolean
}

// ─── Analytics types ───────────────────────────────────────────────────────

export interface DailyRun {
  date: string
  runs: number
  success: number
  failed: number
  blocked: number
}

export interface TokenTrend {
  date: string
  avg_tokens: number
  avg_cost_usd: number
}

export interface OutcomeDistribution {
  name: string
  value: number
  color: string
}

export interface ToolUsage {
  tool: string
  count: number
}

export interface AnalyticsSummary {
  daily_runs: DailyRun[]
  token_trend: TokenTrend[]
  outcome_distribution: OutcomeDistribution[]
  top_tools: ToolUsage[]
  total_runs: number
  success_rate: number
  avg_cost_usd: number
  active_policies: number
}

// ─── WebSocket message types ───────────────────────────────────────────────

export type WsMessageType = 'step' | 'complete' | 'error' | 'policy_alert'

export interface WsMessage {
  type: WsMessageType
  data: WsStepData | WsCompleteData | WsErrorData | WsPolicyAlertData
}

export interface WsStepData extends ExecutionStep {}

export interface WsCompleteData {
  session_id: string
  total_tokens: number
  total_cost_usd: number
  status: SessionStatus
}

export interface WsErrorData {
  message: string
  code?: string
}

export interface WsPolicyAlertData {
  policy_id: string
  policy_name: string
  rule: string
  blocked_content: string
  step_id: string
}

// ─── UI helper types ───────────────────────────────────────────────────────

export interface StatCardData {
  label: string
  value: string | number
  icon: string
  trend?: number
  trendLabel?: string
}
