"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  Megaphone,
  DollarSign,
  UserCog,
  CheckSquare,
  Settings,
  LogOut,
  Zap,
  X,
} from "lucide-react"

const plataformaItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
]

const gestaoItems = [
  { href: "/equipe", label: "Equipe", icon: UserCog },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const renderNavItem = (item: (typeof plataformaItems)[number]) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-bg-sidebar-active text-text-sidebar-active"
            : "text-text-sidebar hover:bg-bg-sidebar-hover hover:text-white"
        )}
      >
        <item.icon size={18} className={isActive ? "text-white" : ""} />
        {item.label}
      </Link>
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-bg-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Zap size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">ERP Agency</span>
              <span className="text-[10px] font-medium text-text-sidebar leading-tight">Performance</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-sidebar hover:text-white lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4">
          {/* PLATAFORMA section */}
          <div className="mb-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-sidebar/60">
              Plataforma
            </p>
            <div className="space-y-0.5">
              {plataformaItems.map(renderNavItem)}
            </div>
          </div>

          {/* GESTAO section */}
          <div className="mb-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-sidebar/60">
              Gestao
            </p>
            <div className="space-y-0.5">
              {gestaoItems.map(renderNavItem)}
            </div>
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/10 p-3">
          {session?.user && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium text-white leading-tight">
                  {session.user.name}
                </p>
                <p className="truncate text-[11px] text-text-sidebar leading-tight">
                  {session.user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded p-1.5 text-text-sidebar hover:bg-bg-sidebar-hover hover:text-white transition-colors cursor-pointer"
                aria-label="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
