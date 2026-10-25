'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Rocket,
  History,
  Shield,
  BarChart3,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents/new', label: 'New Agent', icon: Rocket },
  { href: '/history', label: 'History', icon: History },
  { href: '/policies', label: 'Policies', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col bg-sentinel-surface border-r border-sentinel-border z-50">
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sentinel-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sentinel-accent/20 border border-sentinel-accent/30">
          <Zap className="w-4 h-4 text-sentinel-accent" />
        </div>
        <span className="text-lg font-bold tracking-wider gradient-text">
          SENTINEL
        </span>
      </div>

      {/* ── Nav links ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sentinel-accent/15 text-sentinel-accent border border-sentinel-accent/25 shadow-glow-accent/20'
                  : 'text-sentinel-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 flex-shrink-0',
                  active ? 'text-sentinel-accent' : 'text-sentinel-muted'
                )}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sentinel-accent" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-sentinel-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sentinel-muted">Version</span>
          <span className="text-xs font-mono text-sentinel-accent bg-sentinel-accent/10 px-2 py-0.5 rounded-full border border-sentinel-accent/20">
            v1.0.0
          </span>
        </div>
        <p className="text-xs text-sentinel-muted/50 mt-1">
          AI Command &amp; Control
        </p>
      </div>
    </aside>
  )
}
