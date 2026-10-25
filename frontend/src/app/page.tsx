import Link from 'next/link'
import {
  Rocket,
  Activity,
  CheckCircle,
  DollarSign,
  Shield,
  ArrowRight,
  Zap,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { MOCK_SESSIONS, MOCK_ANALYTICS } from '@/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatCost(usd: number) {
  return `$${usd.toFixed(4)}`
}

export default function DashboardPage() {
  const recentSessions = MOCK_SESSIONS.slice(0, 5)
  const analytics = MOCK_ANALYTICS

  return (
    <div className="min-h-screen bg-grid bg-sentinel-bg p-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-sentinel-success/10 border border-sentinel-success/25 rounded-full">
              <div className="w-2 h-2 rounded-full bg-sentinel-success live-dot" />
              <span className="text-xs font-medium text-sentinel-success">
                Systems Nominal
              </span>
            </div>
          </div>
          <p className="text-sm text-sentinel-muted">
            Real-time overview of your AI agent fleet
          </p>
        </div>

        <Link
          href="/agents/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-sentinel-accent hover:bg-sentinel-accent/80 text-white rounded-lg font-medium text-sm transition-colors shadow-glow-accent"
        >
          <Rocket className="w-4 h-4" />
          Launch Agent
        </Link>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Runs"
          value={analytics.total_runs}
          icon={<Activity className="w-5 h-5" />}
          trend={12}
          trendLabel="vs last week"
        />
        <StatCard
          label="Success Rate"
          value={`${analytics.success_rate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={3}
          trendLabel="vs last week"
          accentColor="text-sentinel-success"
        />
        <StatCard
          label="Avg Cost / Run"
          value={`$${analytics.avg_cost_usd.toFixed(3)}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={-5}
          trendLabel="cheaper this week"
          accentColor="text-sentinel-warning"
        />
        <StatCard
          label="Active Policies"
          value={analytics.active_policies}
          icon={<Shield className="w-5 h-5" />}
          accentColor="text-sentinel-danger"
        />
      </div>

      {/* ── Main content grid ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent sessions table */}
        <div className="col-span-2 bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-sentinel-border">
            <h2 className="font-semibold text-white">Recent Sessions</h2>
            <Link
              href="/history"
              className="flex items-center gap-1 text-xs text-sentinel-accent hover:text-sentinel-accent/80 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-sentinel-border">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/agents/${session.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-sentinel-accent transition-colors">
                    {session.task}
                  </p>
                  <p className="text-xs text-sentinel-muted mt-0.5">
                    {formatDate(session.created_at)} ·{' '}
                    <span className="font-mono">{session.model}</span>
                  </p>
                </div>
                <StatusBadge status={session.status} />
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-mono text-white">
                    {formatCost(session.total_cost_usd)}
                  </p>
                  <p className="text-xs text-sentinel-muted">
                    {session.total_tokens.toLocaleString()} tokens
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick launch CTA */}
          <div className="bg-gradient-to-br from-sentinel-accent/20 to-purple-900/20 border border-sentinel-accent/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-sentinel-accent" />
              <h3 className="font-semibold text-white">Quick Launch</h3>
            </div>
            <p className="text-sm text-sentinel-muted mb-4">
              Spin up a new AI agent task in seconds. Fully governed by your
              active policies.
            </p>
            <Link
              href="/agents/new"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-sentinel-accent hover:bg-sentinel-accent/80 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Launch New Agent
            </Link>
          </div>

          {/* FailproofAI status */}
          <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Orchestration API', status: 'Connected' },
                { label: 'Policy Engine', status: 'Connected' },
                { label: 'WebSocket Server', status: 'Connected' },
                { label: 'Model Gateway', status: 'Connected' },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-sentinel-muted">{label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sentinel-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-sentinel-success" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
