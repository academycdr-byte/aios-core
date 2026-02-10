"use client"

import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { getStatusColor } from "@/lib/utils"
import { Menu, Bell } from "lucide-react"

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg-primary/80 px-4 sm:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors lg:hidden cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor("ATIVO")}>
              {session.user.role}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm text-text-secondary sm:block">{session.user.name}</span>
          </div>
        )}
      </div>
    </header>
  )
}
