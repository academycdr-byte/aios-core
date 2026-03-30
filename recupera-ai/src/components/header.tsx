'use client'

import { Bell, Menu, Moon, Sun, LogOut, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/lib/theme-context'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick }: HeaderProps) {
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
    <header
      className="flex h-[var(--header-height)] items-center justify-between px-6 lg:px-8"
      style={{
        borderBottom: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
      }}
    >
      {/* Left: Menu Toggle (mobile) */}
      <div className="flex items-center lg:w-[200px]">
        <button
          onClick={onMenuClick}
          className="p-2 lg:hidden"
          style={{
            borderRadius: '10px',
            color: 'var(--text-secondary)',
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Center: Search */}
      <div className="hidden max-w-[480px] flex-1 sm:flex sm:justify-center">
        <div className="relative w-full max-w-[480px]">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full py-2.5 pl-10 pr-4 text-sm"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 lg:w-[200px] lg:justify-end">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2"
          style={{
            borderRadius: '10px',
            color: 'var(--text-tertiary)',
          }}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2"
          style={{
            borderRadius: '10px',
            color: 'var(--text-tertiary)',
          }}
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        </button>

        {/* Separator */}
        <div
          className="hidden h-6 w-px lg:block"
          style={{ background: 'var(--border)' }}
        />

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5"
            style={{ borderRadius: '10px' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center text-sm font-bold"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                borderRadius: '50%',
              }}
            >
              {user?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="hidden text-left md:block">
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name ?? 'Usuário'}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 animate-fade-in p-1.5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div
                className="px-3 py-2.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  logout()
                }}
                className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-sm"
                style={{
                  borderRadius: '8px',
                  color: 'var(--danger)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--danger-surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
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
