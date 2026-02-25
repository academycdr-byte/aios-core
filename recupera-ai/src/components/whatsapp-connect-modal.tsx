'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Smartphone,
  Unplug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhatsappConnectModalProps {
  storeId: string
  isOpen: boolean
  onClose: () => void
  onStatusChange: (connected: boolean) => void
}

type ModalState = 'idle' | 'loading' | 'qr' | 'connected' | 'error'

export function WhatsappConnectModal({
  storeId,
  isOpen,
  onClose,
  onStatusChange,
}: WhatsappConnectModalProps) {
  const [state, setState] = useState<ModalState>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  // Stop polling when modal closes
  useEffect(() => {
    if (!isOpen && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [isOpen])

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/status?storeId=${storeId}`)
      const json = await res.json()

      if (json.data?.connected) {
        setState('connected')
        onStatusChange(true)
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    } catch {
      // Silently fail - will retry on next poll
    }
  }, [storeId, onStatusChange])

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    pollingRef.current = setInterval(checkStatus, 3000)
  }, [checkStatus])

  const generateQrCode = useCallback(async () => {
    setState('loading')
    setQrCode(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErrorMessage(json.message ?? 'Erro ao conectar WhatsApp')
        setState('error')
        return
      }

      // Check if already connected
      if (json.data?.connected) {
        setState('connected')
        onStatusChange(true)
        return
      }

      // Show QR code
      if (json.data?.qrcode) {
        setQrCode(json.data.qrcode)
        setState('qr')
        // Start polling for connection status
        startPolling()
      } else {
        setErrorMessage('QR Code nao retornado pela API. Tente novamente.')
        setState('error')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro desconhecido ao gerar QR Code'
      )
      setState('error')
    }
  }, [storeId, onStatusChange, startPolling])

  const handleDisconnect = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })

      if (res.ok) {
        setState('idle')
        setQrCode(null)
        onStatusChange(false)
      } else {
        const json = await res.json()
        setErrorMessage(json.message ?? 'Erro ao desconectar')
        setState('error')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro desconhecido ao desconectar'
      )
      setState('error')
    }
  }, [storeId, onStatusChange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Conectar WhatsApp</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-4">
          {/* IDLE - Initial state */}
          {state === 'idle' && (
            <>
              <div className="flex h-32 w-32 items-center justify-center rounded-[var(--radius-lg)] bg-bg-tertiary">
                <Smartphone className="h-12 w-12 text-text-tertiary" />
              </div>
              <p className="text-center text-sm text-text-secondary">
                Clique no botao abaixo para gerar o QR Code e conectar seu WhatsApp Business.
              </p>
              <p className="text-center text-xs text-text-tertiary">
                Abra o WhatsApp {'>'} Configuracoes {'>'} Dispositivos Conectados {'>'} Conectar
                Dispositivo
              </p>
              <button
                onClick={generateQrCode}
                className="w-full rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-semibold text-text-inverse hover:bg-accent-hover"
              >
                Gerar QR Code
              </button>
            </>
          )}

          {/* LOADING */}
          {state === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm text-text-secondary">Processando...</p>
            </>
          )}

          {/* QR CODE */}
          {state === 'qr' && qrCode && (
            <>
              <div className="rounded-[var(--radius-lg)] border border-border bg-white p-3">
                {/* QR code is base64 data URI - next/image not suitable for dynamic base64 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    qrCode.startsWith('data:')
                      ? qrCode
                      : `data:image/png;base64,${qrCode}`
                  }
                  alt="QR Code WhatsApp"
                  className="h-48 w-48"
                />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                <p className="text-xs text-text-tertiary">
                  O status sera atualizado automaticamente ao conectar
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando conexao...
              </div>
              <button
                onClick={generateQrCode}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <RefreshCcw className="h-3 w-3" />
                Gerar novo QR Code
              </button>
            </>
          )}

          {/* CONNECTED */}
          {state === 'connected' && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-base font-semibold text-success">
                  WhatsApp Conectado!
                </p>
                <p className="text-sm text-text-secondary">
                  Seu WhatsApp esta pronto para enviar e receber mensagens de recuperacao.
                </p>
              </div>
              <div className="flex w-full gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-semibold text-text-inverse hover:bg-accent-hover"
                >
                  Fechar
                </button>
                <button
                  onClick={handleDisconnect}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-error/30 px-4 py-2.5 text-sm font-medium text-error hover:bg-error-light'
                  )}
                >
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </button>
              </div>
            </>
          )}

          {/* ERROR */}
          {state === 'error' && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/20">
                <AlertCircle className="h-8 w-8 text-error" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-base font-semibold text-error">Erro</p>
                <p className="text-sm text-text-secondary">
                  {errorMessage ?? 'Ocorreu um erro inesperado.'}
                </p>
              </div>
              <button
                onClick={generateQrCode}
                className="w-full rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-semibold text-text-inverse hover:bg-accent-hover"
              >
                Tentar Novamente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
