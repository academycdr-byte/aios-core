'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  Store,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Carrinhos Abandonados', href: '/carrinhos', icon: ShoppingCart },
  { label: 'Conversas', href: '/conversas', icon: MessageSquare },
  { label: 'Lojas', href: '/lojas', icon: Store },
  { label: 'Configuracoes', href: '/configuracoes', icon: Settings },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-accent">
          <Zap className="h-5 w-5 text-text-inverse" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-text-primary animate-fade-in">
            RecuperaAI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-accent')} />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-accent text-sm font-semibold text-text-inverse">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="truncate text-sm font-medium text-text-primary">
                {user?.name ?? 'Usuario'}
              </p>
              <p className="truncate text-xs text-text-tertiary">
                {user?.email ?? ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle (desktop only) */}
      <div className="hidden border-t border-border px-3 py-3 lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] py-2 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] bg-bg-secondary border-r border-border lg:hidden',
          'transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-4 rounded-[var(--radius-md)] p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30',
          'bg-bg-secondary border-r border-border sidebar-transition',
          collapsed ? 'lg:w-[var(--sidebar-collapsed-width)]' : 'lg:w-[var(--sidebar-width)]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
