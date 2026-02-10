"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

const publicPaths = ["/login", "/registro"]

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (status === "loading") return
    if (!session && !isPublicPath) {
      router.push("/login")
    }
  }, [session, status, isPublicPath, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (isPublicPath) {
    return <>{children}</>
  }

  if (!session) return null

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:pl-60">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
