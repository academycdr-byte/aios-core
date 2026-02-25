'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-[var(--sidebar-width)]">
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
