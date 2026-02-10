"use client"

import { useSession } from "next-auth/react"
import { Menu, Bell, Search } from "lucide-react"

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded p-1.5 text-text-muted hover:text-text-primary lg:hidden cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        {/* Search input */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-48 lg:w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Notificacoes"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        {session?.user && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-text-primary leading-none">{session.user.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{session.user.role}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
