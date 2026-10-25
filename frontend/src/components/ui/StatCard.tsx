import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  className?: string
  accentColor?: string
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  className,
  accentColor = 'text-sentinel-accent',
}: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0
  const trendNeutral = trend === undefined || trend === 0

  return (
    <div
      className={clsx(
        'bg-sentinel-surface border border-sentinel-border rounded-xl p-5',
        'hover:border-sentinel-accent/30 transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={clsx(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-sentinel-accent/10 border border-sentinel-accent/20',
            accentColor
          )}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trendPositive && 'text-sentinel-success bg-sentinel-success/10',
              trendNegative && 'text-sentinel-danger bg-sentinel-danger/10',
              trendNeutral && 'text-sentinel-muted bg-sentinel-muted/10'
            )}
          >
            {trendPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : trendNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {trend !== 0 ? `${Math.abs(trend)}%` : '—'}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-sm text-sentinel-muted mt-0.5">{label}</p>
        {trendLabel && (
          <p className="text-xs text-sentinel-muted/60 mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  )
}
