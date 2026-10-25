import { clsx } from 'clsx'
import type { SessionStatus } from '@/lib/types'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Shield,
} from 'lucide-react'

interface StatusBadgeProps {
  status: SessionStatus | 'active' | 'inactive'
  className?: string
}

const configs: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  completed: {
    label: 'Completed',
    color: 'text-sentinel-success bg-sentinel-success/10 border-sentinel-success/25',
    icon: CheckCircle,
  },
  failed: {
    label: 'Failed',
    color: 'text-sentinel-danger bg-sentinel-danger/10 border-sentinel-danger/25',
    icon: XCircle,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-sentinel-warning bg-sentinel-warning/10 border-sentinel-warning/25',
    icon: Shield,
  },
  running: {
    label: 'Running',
    color: 'text-sentinel-accent bg-sentinel-accent/10 border-sentinel-accent/25',
    icon: Loader2,
  },
  pending: {
    label: 'Pending',
    color: 'text-sentinel-muted bg-sentinel-muted/10 border-sentinel-muted/25',
    icon: Clock,
  },
  active: {
    label: 'Active',
    color: 'text-sentinel-success bg-sentinel-success/10 border-sentinel-success/25',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Inactive',
    color: 'text-sentinel-muted bg-sentinel-muted/10 border-sentinel-muted/25',
    icon: AlertTriangle,
  },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = configs[status] ?? configs.pending
  const Icon = config.icon
  const isSpinning = status === 'running'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.color,
        className
      )}
    >
      <Icon className={clsx('w-3 h-3', isSpinning && 'animate-spin')} />
      {config.label}
    </span>
  )
}
