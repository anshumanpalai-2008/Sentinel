'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Filter, Search } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { MOCK_SESSIONS } from '@/lib/api'
import type { SessionStatus } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDuration(start: string, end?: string) {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

// Extend mock data with more sessions for a richer history table
const allSessions = [
  ...MOCK_SESSIONS,
  {
    id: 'sess_06n3c7p4r8s9t0u1v2w3x4y5',
    task: 'Write unit tests for the auth service',
    status: 'completed' as SessionStatus,
    created_at: new Date(Date.now() - 86400 * 1000 * 4).toISOString(),
    completed_at: new Date(Date.now() - 86400 * 1000 * 4 + 3600 * 1000).toISOString(),
    total_tokens: 11200,
    total_cost_usd: 0.034,
    model: 'gpt-4o',
    execution_steps: [],
  },
  {
    id: 'sess_07o4d8q5s9t0u1v2w3x4y5z6',
    task: 'Set up CI/CD pipeline with GitHub Actions',
    status: 'completed' as SessionStatus,
    created_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    completed_at: new Date(Date.now() - 86400 * 1000 * 5 + 5400 * 1000).toISOString(),
    total_tokens: 19850,
    total_cost_usd: 0.059,
    model: 'gpt-4o',
    execution_steps: [],
  },
  {
    id: 'sess_08p5e9r6t0u1v2w3x4y5z6a7',
    task: 'Migrate SQLite database schema to PostgreSQL',
    status: 'blocked' as SessionStatus,
    created_at: new Date(Date.now() - 86400 * 1000 * 6).toISOString(),
    completed_at: new Date(Date.now() - 86400 * 1000 * 6 + 1800 * 1000).toISOString(),
    total_tokens: 6700,
    total_cost_usd: 0.02,
    model: 'gpt-4o-mini',
    execution_steps: [],
  },
]

const STEP_COUNTS: Record<string, number> = {
  'sess_01j8x2k9m3n4p5q6r7s8t9u0': 24,
  'sess_02j9y3l0n4o5p6q7r8s9t0u1': 11,
  'sess_03k0z4m1o5p6q7r8s9t0u1v2': 38,
  'sess_04l1a5n2p6q7r8s9t0u1v2w3': 7,
  'sess_05m2b6o3q7r8s9t0u1v2w3x4': 31,
  'sess_06n3c7p4r8s9t0u1v2w3x4y5': 19,
  'sess_07o4d8q5s9t0u1v2w3x4y5z6': 42,
  'sess_08p5e9r6t0u1v2w3x4y5z6a7': 9,
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const filteredSessions = allSessions.filter((s) => {
    const matchesSearch =
      s.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      selectedStatus === 'all' ? true : s.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-grid bg-sentinel-bg p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Session History</h1>
          <p className="text-sm text-sentinel-muted">
            All past and current agent sessions — click any row to inspect execution
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-sentinel-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sessions or tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-sentinel-surface border border-sentinel-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-sentinel-muted focus:outline-none focus:border-sentinel-accent w-64 transition-colors"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 px-3 py-2 bg-sentinel-surface border border-sentinel-border rounded-lg text-sm text-sentinel-muted">
            <Filter className="w-4 h-4" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-sentinel-surface text-white">All Status</option>
              <option value="completed" className="bg-sentinel-surface text-white">Completed</option>
              <option value="blocked" className="bg-sentinel-surface text-white">Blocked</option>
              <option value="failed" className="bg-sentinel-surface text-white">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_60px_100px_90px_100px_160px_48px] gap-4 px-6 py-3 border-b border-sentinel-border bg-sentinel-bg/50">
          {['Task', 'Status', 'Steps', 'Tokens', 'Cost', 'Duration', 'Date', ''].map(
            (col) => (
              <div key={col} className="text-xs font-medium text-sentinel-muted uppercase tracking-wider">
                {col}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-sentinel-border">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-sentinel-muted text-sm">
              No sessions match your search or filter criteria.
            </div>
          ) : (
            filteredSessions.map((session) => (
              <Link
                key={session.id}
                href={`/agents/${session.id}`}
                className="grid grid-cols-[1fr_120px_60px_100px_90px_100px_160px_48px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors group"
              >
                {/* Task */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-sentinel-accent transition-colors">
                    {session.task}
                  </p>
                  <p className="text-xs text-sentinel-muted mt-0.5 font-mono">
                    {session.id.slice(5, 13)}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={session.status} />

                {/* Steps */}
                <div className="text-sm font-mono text-sentinel-muted">
                  {STEP_COUNTS[session.id] ?? '—'}
                </div>

                {/* Tokens */}
                <div className="text-sm font-mono text-white">
                  {session.total_tokens.toLocaleString()}
                </div>

                {/* Cost */}
                <div className="text-sm font-mono text-white">
                  ${session.total_cost_usd.toFixed(4)}
                </div>

                {/* Duration */}
                <div className="text-sm font-mono text-sentinel-muted">
                  {formatDuration(session.created_at, session.completed_at)}
                </div>

                {/* Date */}
                <div className="text-xs text-sentinel-muted">
                  {formatDate(session.created_at)}
                </div>

                {/* Action icon */}
                <div className="flex justify-end">
                  <ArrowUpRight className="w-4 h-4 text-sentinel-muted group-hover:text-sentinel-accent transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 px-2">
        <p className="text-xs text-sentinel-muted">
          Showing {allSessions.length} sessions
        </p>
        <p className="text-xs text-sentinel-muted">
          Total spend:{' '}
          <span className="text-white font-mono">
            $
            {allSessions
              .reduce((s, r) => s + r.total_cost_usd, 0)
              .toFixed(4)}
          </span>
        </p>
      </div>
    </div>
  )
}
