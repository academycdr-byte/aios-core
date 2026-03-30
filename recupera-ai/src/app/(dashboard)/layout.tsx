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
    <div className="min-h-screen p-3" style={{ background: 'var(--bg-outer)' }}>
      {/* Floating Container */}
      <div
        className="flex min-h-[calc(100vh-24px)] flex-col overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
        }}
      >
        {/* Header */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Sidebar + Content */}
        <div className="flex flex-1">
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          {/* Content Area */}
          <main
            className="flex-1 p-6 lg:p-8"
            style={{ background: 'var(--bg-primary)' }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
