'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MOCK_ANALYTICS } from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import { Activity, CheckCircle, DollarSign, Shield } from 'lucide-react'

const tooltipStyle = {
  backgroundColor: '#111118',
  border: '1px solid #1e1e2e',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
}

export default function AnalyticsPage() {
  const data = MOCK_ANALYTICS

  return (
    <div className="min-h-screen bg-grid bg-sentinel-bg p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-sm text-sentinel-muted">
          Performance trends and agent activity over the last 7 days
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Runs"
          value={data.total_runs}
          icon={<Activity className="w-5 h-5" />}
          trend={12}
          trendLabel="vs last week"
        />
        <StatCard
          label="Success Rate"
          value={`${data.success_rate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={3}
          accentColor="text-sentinel-success"
        />
        <StatCard
          label="Avg Cost / Run"
          value={`$${data.avg_cost_usd.toFixed(3)}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={-5}
          trendLabel="cheaper vs prior week"
          accentColor="text-sentinel-warning"
        />
        <StatCard
          label="Active Policies"
          value={data.active_policies}
          icon={<Shield className="w-5 h-5" />}
          accentColor="text-sentinel-danger"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart 1: Runs per day */}
        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">Runs Per Day</h2>
          <p className="text-xs text-sentinel-muted mb-5">
            Agent execution volume over last 7 days
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.daily_runs}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v: string) =>
                  new Date(v).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
              />
              <Bar
                dataKey="success"
                name="Success"
                fill="#22c55e"
                stackId="a"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="blocked"
                name="Blocked"
                fill="#f59e0b"
                stackId="a"
              />
              <Bar
                dataKey="failed"
                name="Failed"
                fill="#ef4444"
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Token cost trend */}
        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">Token Cost Trend</h2>
          <p className="text-xs text-sentinel-muted mb-5">
            Average tokens and cost per run
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={data.token_trend}
              margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis
                yAxisId="tokens"
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#6b7280' }} />
              <Line
                yAxisId="tokens"
                type="monotone"
                dataKey="avg_tokens"
                name="Avg Tokens"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="avg_cost_usd"
                name="Avg Cost ($)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Outcome distribution */}
        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">
            Outcome Distribution
          </h2>
          <p className="text-xs text-sentinel-muted mb-5">
            Success vs blocked vs failed breakdown
          </p>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={data.outcome_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.outcome_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-3">
              {data.outcome_distribution.map((entry) => {
                const pct = Math.round(
                  (entry.value / data.total_runs) * 100
                )
                return (
                  <div key={entry.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: entry.color }}
                        />
                        <span className="text-sm text-white">{entry.name}</span>
                      </div>
                      <span className="text-sm font-mono text-white">
                        {entry.value}
                        <span className="text-sentinel-muted ml-1 text-xs">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-sentinel-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: entry.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart 4: Top tools */}
        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">Top 5 Tools Used</h2>
          <p className="text-xs text-sentinel-muted mb-5">
            Most frequently called agent tools
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.top_tools}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="tool"
                tick={{ fill: '#d1d5db', fontSize: 12, fontFamily: 'monospace' }}
                width={90}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Calls" radius={[0, 4, 4, 0]}>
                {data.top_tools.map((_, index) => {
                  const colors = [
                    '#6366f1',
                    '#8b5cf6',
                    '#a78bfa',
                    '#c4b5fd',
                    '#ddd6fe',
                  ]
                  return <Cell key={index} fill={colors[index]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
