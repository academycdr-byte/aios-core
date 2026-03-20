'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageSpinner } from '@/components/ui'
import { Store, Plus } from 'lucide-react'
import { ConnectStoreModal } from '@/components/connect-store-modal'
import type { ConnectStoreData } from '@/components/connect-store-modal'

export default function MinhaLojaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showConnect, setShowConnect] = useState(false)

  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(json => {
        const store = json.data
        if (store) {
          router.replace(`/lojas/${store.id}`)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleConnect(data: ConnectStoreData) {
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.data) {
        if (data.platform === 'SHOPIFY' && json.data.id) {
          window.location.href = `/api/integrations/shopify?storeId=${json.data.id}`
          return
        }
        router.replace(`/lojas/${json.data.id}`)
        return
      }
    } catch {
      // Handle error silently
    }
    setShowConnect(false)
  }

  if (loading) return <PageSpinner message="Carregando sua loja..." />

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light mb-4">
        <Store className="h-8 w-8 text-accent" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">Nenhuma loja conectada</h2>
      <p className="text-text-secondary mb-6">Conecte sua loja Shopify ou Nuvemshop para comecar a recuperar carrinhos.</p>
      <button
        onClick={() => setShowConnect(true)}
        className="flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors"
      >
        <Plus className="h-4 w-4" />
        Conectar Loja
      </button>
      <ConnectStoreModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
