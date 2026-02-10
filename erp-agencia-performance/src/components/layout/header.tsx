"use client"

import { useSession } from "next-auth/react"
import { Menu, Bell } from "lucide-react"

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg-primary px-4 sm:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded p-1.5 text-text-muted hover:text-text-primary lg:hidden cursor-pointer"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>
      <div className="lg:hidden" />

      <div className="flex items-center gap-3">
        <button
          className="relative rounded p-1.5 text-text-muted hover:text-text-primary cursor-pointer"
          aria-label="Notificacoes"
        >
          <Bell size={16} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        {session?.user && (
          <>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
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
