'use client'

import { Bell, Menu, Moon, Sun, LogOut, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick, title = 'Dashboard' }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between border-b border-border bg-bg-secondary/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left: Menu Toggle + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar */}
        <div className="relative hidden sm:flex items-center max-w-sm flex-1">
          <Search className="absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent-light focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative rounded-[var(--radius-md)] p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] p-1.5 hover:bg-surface-hover"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] bg-accent text-sm font-semibold text-text-inverse">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <span className="hidden text-sm font-medium text-text-primary md:block">
              {user?.name ?? 'Usuário'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 animate-fade-in rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-1.5 shadow-[var(--shadow-lg)]">
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-medium text-text-primary">
                  {user?.name}
                </p>
                <p className="text-xs text-text-tertiary">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  logout()
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-error hover:bg-error-light"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
