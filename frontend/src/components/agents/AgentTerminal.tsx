'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import type { ExecutionStep, StepType } from '@/lib/types'
import { Brain, Wrench, CheckCircle, Shield, RotateCcw } from 'lucide-react'

interface AgentTerminalProps {
  steps: ExecutionStep[]
  isRunning: boolean
  className?: string
}

const stepConfig: Record<
  StepType,
  { color: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  reasoning: {
    color: 'text-gray-400',
    label: 'THINK',
    icon: Brain,
  },
  tool_call: {
    color: 'text-blue-400',
    label: 'CALL ',
    icon: Wrench,
  },
  tool_result: {
    color: 'text-sentinel-success',
    label: 'RSLT ',
    icon: CheckCircle,
  },
  policy_intercept: {
    color: 'text-sentinel-danger',
    label: 'BLCK ',
    icon: Shield,
  },
  correction: {
    color: 'text-sentinel-warning',
    label: 'CORR ',
    icon: RotateCcw,
  },
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '--:--:--'
  }
}

export default function AgentTerminal({
  steps,
  isRunning,
  className,
}: AgentTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new steps
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-black rounded-xl border border-sentinel-border overflow-hidden',
        className
      )}
    >
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-sentinel-surface border-b border-sentinel-border flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-sentinel-danger/70" />
          <div className="w-3 h-3 rounded-full bg-sentinel-warning/70" />
          <div className="w-3 h-3 rounded-full bg-sentinel-success/70" />
        </div>
        <span className="text-xs text-sentinel-muted font-mono ml-2">
          sentinel — agent terminal
        </span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-sentinel-success live-dot" />
            <span className="text-xs text-sentinel-success font-mono">LIVE</span>
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 terminal-text">
        {steps.length === 0 && (
          <div className="text-sentinel-muted/50 text-sm">
            <span className="terminal-glow">▶</span> Waiting for agent
            output...
          </div>
        )}

        {steps.map((step) => {
          const config = stepConfig[step.step_type] ?? stepConfig.reasoning
          const Icon = config.icon
          return (
            <div
              key={step.id}
              className={clsx(
                'group flex gap-3 animate-fade-in',
                step.step_type === 'policy_intercept' &&
                  'bg-sentinel-danger/5 border border-sentinel-danger/20 rounded-lg p-2 -mx-2'
              )}
            >
              {/* Timestamp */}
              <span className="text-sentinel-muted/40 text-xs flex-shrink-0 pt-0.5 w-20">
                {formatTimestamp(step.timestamp)}
              </span>

              {/* Step type badge */}
              <div className={clsx('flex items-center gap-1.5 flex-shrink-0', config.color)}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-bold opacity-70">
                  [{config.label}]
                </span>
              </div>

              {/* Content */}
              <div className={clsx('flex-1 text-sm leading-relaxed', config.color)}>
                {step.tool_name && (
                  <span className="text-blue-300 font-semibold">
                    {step.tool_name}
                    {' '}›{' '}
                  </span>
                )}
                <span className="break-words">{step.content}</span>
                {step.latency_ms !== undefined && (
                  <span className="text-sentinel-muted/40 text-xs ml-2">
                    ({step.latency_ms}ms)
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Blinking cursor when running */}
        {isRunning && (
          <div className="flex items-center gap-2 text-sentinel-success text-sm">
            <span className="text-sentinel-muted/40 text-xs w-20">
              {new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="terminal-cursor terminal-glow">agent processing</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
