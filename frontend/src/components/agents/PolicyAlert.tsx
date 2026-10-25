'use client'

import { useEffect, useState } from 'react'
import { Shield, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { PolicyAlert } from '@/lib/websocket'

interface PolicyAlertProps {
  alert: PolicyAlert
  onDismiss: (id: string) => void
}

function PolicyAlertCard({ alert, onDismiss }: PolicyAlertProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(alert.id), 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [alert.id, onDismiss])

  return (
    <div
      className={clsx(
        'flex gap-3 bg-sentinel-surface border border-sentinel-danger/50 rounded-xl p-4 shadow-glow-danger',
        'animate-slide-in transition-all duration-300',
        !visible && 'opacity-0 translate-x-full'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 flex items-start pt-0.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sentinel-danger/15 border border-sentinel-danger/30">
          <Shield className="w-4 h-4 text-sentinel-danger" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-sentinel-danger">
            Policy Intercept
          </p>
          <span className="text-xs text-sentinel-muted flex-shrink-0">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-xs font-medium text-white mb-1">{alert.policy_name}</p>
        <p className="text-xs text-sentinel-muted line-clamp-2">
          {alert.blocked_content}
        </p>
        {alert.rule && (
          <p className="text-xs text-sentinel-danger/60 font-mono mt-1 line-clamp-1">
            rule: {alert.rule}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(alert.id), 300)
        }}
        className="flex-shrink-0 text-sentinel-muted hover:text-white transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Alert stack container ────────────────────────────────────────────────

interface PolicyAlertStackProps {
  alerts: PolicyAlert[]
}

export default function PolicyAlertStack({ alerts }: PolicyAlertStackProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<PolicyAlert[]>([])

  useEffect(() => {
    setVisibleAlerts(alerts.slice(0, 4)) // cap at 4 visible
  }, [alerts])

  const dismiss = (id: string) => {
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {visibleAlerts.map((alert) => (
        <PolicyAlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
      ))}
    </div>
  )
}
