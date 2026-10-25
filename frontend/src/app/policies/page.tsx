'use client'

import { useState } from 'react'
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { MOCK_POLICIES } from '@/lib/api'
import type { Policy, CreatePolicyDto } from '@/lib/types'
import { clsx } from 'clsx'
import { togglePolicy, deletePolicy, createPolicy } from '@/lib/api'

const EMPTY_FORM: CreatePolicyDto = {
  name: '',
  description: '',
  rule: '',
  active: true,
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(MOCK_POLICIES)
  const [form, setForm] = useState<CreatePolicyDto>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.rule.trim()) return
    setSaving(true)
    try {
      const created = await createPolicy(form)
      setPolicies((prev) => [created, ...prev])
      setForm(EMPTY_FORM)
    } catch {
      // Mock fallback
      const mockNew: Policy = {
        id: `pol_${Date.now()}`,
        name: form.name,
        description: form.description,
        rule: form.rule,
        active: form.active ?? true,
        created_at: new Date().toISOString(),
      }
      setPolicies((prev) => [mockNew, ...prev])
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(policy: Policy) {
    setTogglingId(policy.id)
    try {
      await togglePolicy(policy.id, !policy.active)
    } catch {
      // offline — optimistic
    } finally {
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, active: !p.active } : p))
      )
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePolicy(id)
    } catch {
      // offline — optimistic
    }
    setPolicies((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-grid bg-sentinel-bg p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Policy Manager</h1>
        <p className="text-sm text-sentinel-muted">
          Define guardrails that govern every agent action in real time
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* ── Policy list (left 3/5) ──────────────────────── */}
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-sentinel-muted">
              {policies.filter((p) => p.active).length} active ·{' '}
              {policies.filter((p) => !p.active).length} inactive
            </p>
          </div>

          {policies.map((policy) => (
            <div
              key={policy.id}
              className={clsx(
                'bg-sentinel-surface border rounded-xl p-5 transition-all',
                policy.active
                  ? 'border-sentinel-border hover:border-sentinel-accent/30'
                  : 'border-sentinel-border/50 opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={clsx(
                    'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                    policy.active
                      ? 'bg-sentinel-danger/15 border border-sentinel-danger/30'
                      : 'bg-sentinel-muted/10 border border-sentinel-muted/20'
                  )}
                >
                  <Shield
                    className={clsx(
                      'w-5 h-5',
                      policy.active ? 'text-sentinel-danger' : 'text-sentinel-muted'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{policy.name}</h3>
                    {policy.active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sentinel-success/10 text-sentinel-success border border-sentinel-success/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-sentinel-muted mb-2">
                    {policy.description}
                  </p>
                  <code className="text-xs font-mono text-sentinel-muted/70 bg-sentinel-bg border border-sentinel-border px-3 py-1.5 rounded-lg block truncate">
                    {policy.rule}
                  </code>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(policy)}
                    className="text-sentinel-muted hover:text-white transition-colors"
                    disabled={togglingId === policy.id}
                  >
                    {togglingId === policy.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : policy.active ? (
                      <ToggleRight className="w-6 h-6 text-sentinel-success" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="text-sentinel-muted hover:text-sentinel-danger transition-colors p-1 rounded-lg hover:bg-sentinel-danger/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {policies.length === 0 && (
            <div className="text-center py-16 text-sentinel-muted">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No policies yet. Create one to start governing your agents.</p>
            </div>
          )}
        </div>

        {/* ── Create policy form (right 2/5) ────────────────── */}
        <div className="col-span-2">
          <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-5">
              <Plus className="w-4 h-4 text-sentinel-accent" />
              <h2 className="font-semibold text-white">Create Policy</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-sentinel-muted mb-1.5">
                  Policy Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. No File Deletion"
                  className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-sentinel-muted/50 focus:outline-none focus:border-sentinel-accent/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sentinel-muted mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What does this policy do?"
                  className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-sentinel-muted/50 focus:outline-none focus:border-sentinel-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sentinel-muted mb-1.5">
                  Rule Expression *
                </label>
                <textarea
                  rows={5}
                  value={form.rule}
                  onChange={(e) => setForm({ ...form, rule: e.target.value })}
                  placeholder={'BLOCK if tool_name == "bash" and "rm -rf" in args'}
                  className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-sentinel-muted/50 focus:outline-none focus:border-sentinel-accent/50 transition-colors font-mono resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500"
                />
                <label
                  htmlFor="active"
                  className="text-sm text-sentinel-muted cursor-pointer"
                >
                  Enable immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || !form.name.trim() || !form.rule.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-sentinel-accent hover:bg-sentinel-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? 'Creating…' : 'Create Policy'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
