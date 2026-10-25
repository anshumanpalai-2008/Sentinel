'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Clock,
  Cpu,
  DollarSign,
  Wifi,
  WifiOff,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import AgentTerminal from '@/components/agents/AgentTerminal'
import ExecutionGraph from '@/components/agents/ExecutionGraph'
import PolicyAlertStack from '@/components/agents/PolicyAlert'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAgentWebSocket } from '@/lib/websocket'
import { MOCK_SESSIONS, MOCK_STEPS } from '@/lib/api'
import type { AgentSession } from '@/lib/types'

// ─── Live timer ────────────────────────────────────────────────────────────

function useElapsedTime(startIso: string | undefined) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startIso) return
    const start = new Date(startIso).getTime()
    const id = setInterval(() => setElapsed(Date.now() - start), 1000)
    return () => clearInterval(id)
  }, [startIso])

  const s = Math.floor(elapsed / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0
    ? `${h}h ${m % 60}m ${s % 60}s`
    : m > 0
    ? `${m}m ${s % 60}s`
    : `${s}s`
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AgentSessionPage() {
  const params = useParams()
  const sessionId = params?.sessionId as string

  const [session, setSession] = useState<AgentSession | null>(null)
  const [useMock, setUseMock] = useState(false)

  const ws = useAgentWebSocket(useMock ? null : sessionId)
  const elapsed = useElapsedTime(session?.created_at)

  // Load session metadata
  useEffect(() => {
    const found = MOCK_SESSIONS.find((s) => s.id === sessionId)
    if (found) {
      setSession(found)
      setUseMock(true)
    } else {
      // Treat as a live real session
      setUseMock(false)
    }
  }, [sessionId])

  // For demo: use mock steps when no WS
  const steps = useMock ? MOCK_STEPS : ws.steps
  const status = useMock ? (session?.status ?? 'completed') : ws.status
  const isRunning = status === 'running'
  const isConnected = useMock ? false : ws.isConnected
  const totalTokens = useMock
    ? session?.total_tokens ?? 0
    : ws.totalTokens
  const totalCost = useMock
    ? session?.total_cost_usd ?? 0
    : ws.totalCost

  const shortId = sessionId
    ? `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`
    : '—'

  return (
    <div className="flex flex-col h-screen bg-sentinel-bg overflow-hidden">
      {/* Policy alert toasts */}
      {!useMock && <PolicyAlertStack alerts={ws.alerts} />}

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 py-4 bg-sentinel-surface border-b border-sentinel-border flex-shrink-0">
        <Link
          href="/history"
          className="text-sentinel-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-sentinel-muted">Session</span>
          <code className="text-xs font-mono text-white bg-sentinel-border px-2 py-0.5 rounded">
            {shortId}
          </code>
        </div>

        <div className="flex items-center gap-1.5 text-sentinel-muted text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{elapsed}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sentinel-muted text-xs">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono">{totalTokens.toLocaleString()} tok</span>
        </div>

        <div className="flex items-center gap-1.5 text-sentinel-muted text-xs">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="font-mono">${totalCost.toFixed(4)}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isConnected ? 'text-sentinel-success' : 'text-sentinel-muted'
            }`}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {isConnected ? 'Live' : useMock ? 'Demo' : 'Disconnected'}
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      {/* ── Task header ─────────────────────────────────────── */}
      {session && (
        <div className="px-6 py-3 bg-sentinel-surface/50 border-b border-sentinel-border flex-shrink-0">
          <p className="text-sm text-sentinel-muted">
            <span className="text-white font-medium">Task: </span>
            {session.task}
          </p>
        </div>
      )}

      {/* ── Split layout ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left: Terminal (40%) */}
        <div className="w-2/5 flex flex-col p-4 min-h-0">
          <AgentTerminal
            steps={steps}
            isRunning={isRunning}
            className="flex-1"
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-sentinel-border flex-shrink-0" />

        {/* Right: Graph (60%) */}
        <div className="flex-1 flex flex-col p-4 min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-sm font-semibold text-white">Execution Graph</h2>
            <span className="text-xs text-sentinel-muted">
              {steps.length} step{steps.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ExecutionGraph steps={steps} className="flex-1" />
        </div>
      </div>
    </div>
  )
}
