'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { clsx } from 'clsx'
import type { ExecutionStep, StepType } from '@/lib/types'
import { Brain, Wrench, CheckCircle, Shield, RotateCcw } from 'lucide-react'

// ─── Custom node ───────────────────────────────────────────────────────────

interface StepNodeData {
  step: ExecutionStep
}

const stepStyle: Record<
  StepType,
  { border: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  reasoning: {
    border: 'border-gray-600',
    bg: 'bg-gray-900',
    text: 'text-gray-300',
    icon: Brain,
  },
  tool_call: {
    border: 'border-blue-500/60',
    bg: 'bg-blue-950/50',
    text: 'text-blue-300',
    icon: Wrench,
  },
  tool_result: {
    border: 'border-sentinel-success/60',
    bg: 'bg-green-950/50',
    text: 'text-sentinel-success',
    icon: CheckCircle,
  },
  policy_intercept: {
    border: 'border-sentinel-danger',
    bg: 'bg-red-950/60',
    text: 'text-sentinel-danger',
    icon: Shield,
  },
  correction: {
    border: 'border-sentinel-warning/60',
    bg: 'bg-yellow-950/50',
    text: 'text-sentinel-warning',
    icon: RotateCcw,
  },
}

function StepNode({ data }: { data: StepNodeData }) {
  const { step } = data
  const style = stepStyle[step.step_type] ?? stepStyle.reasoning
  const Icon = style.icon
  const isPolicy = step.step_type === 'policy_intercept'

  return (
    <div
      className={clsx(
        'px-3 py-2.5 rounded-lg border text-xs max-w-[220px] shadow-lg',
        style.border,
        style.bg,
        isPolicy && 'policy-node-glow min-w-[180px]'
      )}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#1e1e2e', border: '1px solid #374151' }} />

      <div className={clsx('flex items-center gap-2 mb-1.5 font-semibold', style.text)}>
        <Icon className={clsx('w-3.5 h-3.5 flex-shrink-0', isPolicy && 'w-4 h-4')} />
        <span className="uppercase tracking-wider text-[10px]">
          {step.step_type.replace('_', ' ')}
        </span>
        {step.tool_name && (
          <span className="text-blue-300 font-mono">{step.tool_name}</span>
        )}
      </div>

      <p className="text-gray-400 leading-relaxed line-clamp-3 font-mono text-[10px]">
        {step.content}
      </p>

      {step.latency_ms !== undefined && (
        <div className="mt-1.5 text-[10px] text-gray-600">
          {step.latency_ms}ms
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#1e1e2e', border: '1px solid #374151' }} />
    </div>
  )
}

const nodeTypes = { stepNode: StepNode }

// ─── Main component ────────────────────────────────────────────────────────

interface ExecutionGraphProps {
  steps: ExecutionStep[]
  className?: string
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 110
const H_GAP = 50
const V_GAP = 60
const NODES_PER_ROW = 3

export default function ExecutionGraph({ steps, className }: ExecutionGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = steps.map((step, i) => {
      const col = i % NODES_PER_ROW
      const row = Math.floor(i / NODES_PER_ROW)
      return {
        id: step.id,
        type: 'stepNode',
        position: {
          x: col * (NODE_WIDTH + H_GAP),
          y: row * (NODE_HEIGHT + V_GAP),
        },
        data: { step },
      }
    })

    const edges: Edge[] = steps.slice(1).map((step, i) => ({
      id: `e-${steps[i].id}-${step.id}`,
      source: steps[i].id,
      target: step.id,
      style: { stroke: '#374151', strokeWidth: 1.5 },
      animated: step.step_type === 'policy_intercept',
    }))

    return { nodes, edges }
  }, [steps])

  if (steps.length === 0) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center h-full rounded-xl border border-sentinel-border bg-sentinel-surface text-sentinel-muted text-sm',
          className
        )}
      >
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">⬡</div>
          <p>Execution graph will appear here</p>
          <p className="text-xs mt-1 text-sentinel-muted/50">Nodes populate as the agent runs</p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('rounded-xl border border-sentinel-border overflow-hidden', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e1e2e"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const step = (node.data as StepNodeData).step
            const colors: Record<StepType, string> = {
              reasoning: '#6b7280',
              tool_call: '#3b82f6',
              tool_result: '#22c55e',
              policy_intercept: '#ef4444',
              correction: '#f59e0b',
            }
            return colors[step.step_type] ?? '#6b7280'
          }}
          maskColor="rgba(10, 10, 15, 0.6)"
        />
      </ReactFlow>
    </div>
  )
}
