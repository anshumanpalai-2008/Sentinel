'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type {
  ExecutionStep,
  SessionStatus,
  WsCompleteData,
  WsErrorData,
  WsMessage,
  WsPolicyAlertData,
  WsStepData,
} from './types'

const getWsBase = () => {
  if (typeof window === 'undefined') return 'ws://localhost:8000'
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
  }
  // In Vercel or production on the same domain, connect directly to window.location host
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

const WS_BASE = getWsBase()

export interface PolicyAlert {
  id: string
  policy_name: string
  rule: string
  blocked_content: string
  timestamp: Date
}

export interface UseAgentWebSocketReturn {
  steps: ExecutionStep[]
  status: SessionStatus
  isConnected: boolean
  latestAlert: PolicyAlert | null
  alerts: PolicyAlert[]
  totalTokens: number
  totalCost: number
  error: string | null
}

export function useAgentWebSocket(
  sessionId: string | null
): UseAgentWebSocketReturn {
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [status, setStatus] = useState<SessionStatus>('pending')
  const [isConnected, setIsConnected] = useState(false)
  const [latestAlert, setLatestAlert] = useState<PolicyAlert | null>(null)
  const [alerts, setAlerts] = useState<PolicyAlert[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const connect = useCallback(() => {
    if (!sessionId) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/agents/${sessionId}`)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        setStatus('running')
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: WsMessage = JSON.parse(event.data as string)
          handleMessage(msg)
        } catch {
          console.warn('[WS] Failed to parse message:', event.data)
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Attempt reconnect unless session is done
        if (
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS &&
          !['completed', 'failed', 'blocked'].includes(status)
        ) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttemptsRef.current,
            16000
          )
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        }
      }
    } catch (err) {
      setError(`Failed to connect: ${String(err)}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  function handleMessage(msg: WsMessage) {
    switch (msg.type) {
      case 'step': {
        const step = msg.data as WsStepData
        setSteps((prev) => {
          // avoid duplicates
          if (prev.find((s) => s.id === step.id)) return prev
          return [...prev, step]
        })
        break
      }
      case 'complete': {
        const complete = msg.data as WsCompleteData
        setStatus(complete.status)
        setTotalTokens(complete.total_tokens)
        setTotalCost(complete.total_cost_usd)
        setIsConnected(false)
        wsRef.current?.close()
        break
      }
      case 'error': {
        const errData = msg.data as WsErrorData
        setError(errData.message)
        setStatus('failed')
        break
      }
      case 'policy_alert': {
        const alert = msg.data as WsPolicyAlertData
        const newAlert: PolicyAlert = {
          id: alert.policy_id + '-' + Date.now(),
          policy_name: alert.policy_name,
          rule: alert.rule,
          blocked_content: alert.blocked_content,
          timestamp: new Date(),
        }
        setLatestAlert(newAlert)
        setAlerts((prev) => [newAlert, ...prev])
        break
      }
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return {
    steps,
    status,
    isConnected,
    latestAlert,
    alerts,
    totalTokens,
    totalCost,
    error,
  }
}
