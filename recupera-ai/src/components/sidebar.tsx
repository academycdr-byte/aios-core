'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  MessageSquare,
  Settings,
  Zap,
  X,
  BarChart3,
  BookOpen,
  GitBranch,
  MessageCircle,
  Receipt,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Menu',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Carrinhos', href: '/carrinhos', icon: ShoppingCart },
      { label: 'Conversas', href: '/conversas', icon: MessageSquare },
    ],
  },
  {
    title: 'Loja',
    items: [
      { label: 'Visão Geral', href: '/minha-loja?tab=overview', icon: BarChart3 },
      { label: 'Recuperação', href: '/minha-loja?tab=recovery', icon: GitBranch },
      { label: 'Conhecimento', href: '/minha-loja?tab=knowledge', icon: BookOpen },
      { label: 'WhatsApp', href: '/minha-loja?tab=whatsapp', icon: MessageCircle },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Cobrança', href: '/cobranca', icon: Receipt },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const [currentTab, setCurrentTab] = useState<string | null>(null)
  useEffect(() => {
    function syncTab() {
      const params = new URLSearchParams(window.location.search)
      setCurrentTab(params.get('tab'))
    }
    syncTab()
    window.addEventListener('popstate', syncTab)
    return () => window.removeEventListener('popstate', syncTab)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      const basePath = pathname.startsWith('/lojas') ? '/minha-loja' : pathname
      if (basePath !== path && !pathname.startsWith(path)) return false
      const params = new URLSearchParams(query)
      const tab = params.get('tab')
      return tab ? currentTab === tab : true
    }
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{
              background: 'var(--accent)',
              borderRadius: '12px',
            }}
          >
            <Zap className="h-5 w-5" style={{ color: 'var(--text-inverse)' }} />
          </div>
          <span
            className="text-[15px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            RecuperaAI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && 'mt-6')}>
            <p
              className="mb-2 px-4 text-[13px] font-medium"
              style={{
                color: 'var(--text-tertiary)',
                letterSpacing: '0.02em',
              }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-[16px] transition-colors',
                      active ? 'font-semibold' : 'font-medium'
                    )}
                    style={{
                      borderRadius: '16px',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      background: active ? 'var(--accent-surface)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div
                      className="shrink-0"
                      style={{
                        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 text-[16px] font-medium transition-colors"
          style={{
            borderRadius: '16px',
            color: 'var(--danger)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger-surface)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut className="h-[22px] w-[22px]" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] lg:hidden',
          'transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-3 top-4 p-1.5 lg:hidden"
          style={{
            borderRadius: '10px',
            color: 'var(--text-tertiary)',
          }}
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar — part of the floating container, NO border, NO bg */}
      <aside
        className="hidden w-[var(--sidebar-width)] shrink-0 lg:block"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
