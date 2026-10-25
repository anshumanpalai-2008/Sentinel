'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Rocket,
  Loader2,
  Sparkles,
  Terminal,
  Database,
  Bug,
  Code,
} from 'lucide-react'
import { startAgent, MOCK_SESSIONS } from '@/lib/api'

const SUGGESTIONS = [
  { text: 'Write a REST API for a todo app', icon: Code },
  { text: 'Refactor this Python script for performance', icon: Terminal },
  { text: 'Debug why my tests are failing', icon: Bug },
  { text: 'Create a data analysis pipeline', icon: Database },
]

export default function NewAgentPage() {
  const router = useRouter()
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLaunch() {
    const trimmed = task.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)

    try {
      const { session_id } = await startAgent(trimmed)
      router.push(`/agents/${session_id}`)
    } catch {
      // Backend offline — use mock session for demo
      const mockId = MOCK_SESSIONS[0].id
      router.push(`/agents/${mockId}`)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleLaunch()
    }
  }

  return (
    <div className="min-h-screen bg-grid bg-sentinel-bg flex flex-col items-center justify-center p-8">
      {/* ── Ambient glow ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-radial from-sentinel-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sentinel-accent/10 border border-sentinel-accent/25 rounded-full text-xs text-sentinel-accent font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Powered by GPT-4o + Policy Engine
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            What should the{' '}
            <span className="gradient-text">agent do?</span>
          </h1>
          <p className="text-sentinel-muted text-lg">
            Describe your task in plain English. SENTINEL handles the rest.
          </p>
        </div>

        {/* Main input */}
        <div className="bg-sentinel-surface border border-sentinel-border rounded-2xl overflow-hidden shadow-sentinel mb-4 focus-within:border-sentinel-accent/50 transition-colors">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Write a FastAPI server with JWT authentication and a PostgreSQL backend..."
            rows={5}
            className="w-full bg-transparent px-6 pt-5 pb-3 text-white text-lg placeholder-sentinel-muted/50 resize-none focus:outline-none"
            autoFocus
            disabled={loading}
          />

          <div className="flex items-center justify-between px-6 py-3 border-t border-sentinel-border">
            <span className="text-xs text-sentinel-muted">
              ⌘↵ to launch
            </span>

            <button
              onClick={handleLaunch}
              disabled={!task.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-sentinel-accent hover:bg-sentinel-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-glow-accent"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Launching…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Launch Agent
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sentinel-danger text-sm text-center mb-4 bg-sentinel-danger/10 border border-sentinel-danger/25 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Task suggestions */}
        <div className="mt-6">
          <p className="text-xs text-sentinel-muted text-center mb-3">
            Try an example
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map(({ text, icon: Icon }) => (
              <button
                key={text}
                onClick={() => setTask(text)}
                disabled={loading}
                className="flex items-center gap-2.5 px-4 py-3 bg-sentinel-surface hover:bg-sentinel-border border border-sentinel-border hover:border-sentinel-accent/30 rounded-xl text-sm text-sentinel-muted hover:text-white transition-all text-left disabled:opacity-50"
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-sentinel-accent/70" />
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-sentinel-muted/50 mt-8">
          All agent actions are monitored in real-time and governed by your
          active safety policies.
        </p>
      </div>
    </div>
  )
}
