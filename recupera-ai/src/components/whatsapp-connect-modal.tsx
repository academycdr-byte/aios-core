'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Smartphone,
  Unplug,
  Hash,
  QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '@/components/ui'

interface WhatsappConnectModalProps {
  storeId: string
  isOpen: boolean
  onClose: () => void
  onStatusChange: (connected: boolean) => void
}

type ModalState = 'idle' | 'loading' | 'pairing' | 'qr' | 'connected' | 'error'

export function WhatsappConnectModal({
  storeId,
  isOpen,
  onClose,
  onStatusChange,
}: WhatsappConnectModalProps) {
  const [state, setState] = useState<ModalState>('idle')
  const [phone, setPhone] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState('idle')
      setPairingCode(null)
      setQrCode(null)
      setErrorMessage(null)
    }
  }, [isOpen])

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/status?storeId=${storeId}`)
      const json = await res.json()

      if (json.data?.connected) {
        setState('connected')
        onStatusChange(true)
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

  const connect = useCallback(
    async (usePhone: boolean) => {
      setState('loading')
      setPairingCode(null)
      setQrCode(null)
      setErrorMessage(null)

      try {
        const bodyPayload: Record<string, string> = { storeId }
        if (usePhone && phone.trim()) {
          bodyPayload.phone = phone.trim()
        }

        const res = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
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

        // Pairing code method (preferred)
        if (json.data?.pairingCode) {
          setPairingCode(json.data.pairingCode)
          setQrCode(json.data.qrcode ?? null)
          setState('pairing')
          startPolling()
          return
        }

        // Fallback to QR code
        if (json.data?.qrcode) {
          setQrCode(json.data.qrcode)
          setState('qr')
          startPolling()
          return
        }

        setErrorMessage('Nenhum codigo de pareamento retornado. Tente novamente.')
        setState('error')
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Erro desconhecido'
        )
        setState('error')
      }
    },
    [storeId, phone, onStatusChange, startPolling]
  )

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
        setPairingCode(null)
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

  // Format phone for display: (11) 99999-9999
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (digits.length <= 11) {
      setPhone(digits)
    }
  }

  const isPhoneValid = phone.replace(/\D/g, '').length >= 10

  // Format pairing code for display: XXXX-XXXX
  const formattedPairingCode = pairingCode
    ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
    : ''

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
          {/* IDLE - Phone number input */}
          {state === 'idle' && (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <Smartphone className="h-10 w-10 text-accent" />
              </div>

              <div className="w-full space-y-1">
                <label className="block text-sm font-medium text-text-primary">
                  Numero do WhatsApp Business
                </label>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2.5 text-center text-lg tracking-wider text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                />
                <p className="text-center text-xs text-text-tertiary">
                  O numero que sera usado para enviar mensagens de recuperacao
                </p>
              </div>

              <Button
                onClick={() => connect(true)}
                disabled={!isPhoneValid}
                className="w-full"
              >
                <Hash className="h-4 w-4" />
                Gerar Codigo de Pareamento
              </Button>

              <div className="flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-tertiary">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="secondary"
                onClick={() => connect(false)}
                className="w-full"
              >
                <QrCode className="h-4 w-4" />
                Usar QR Code
              </Button>
            </>
          )}

          {/* LOADING */}
          {state === 'loading' && (
            <>
              <Spinner size="lg" />
              <p className="text-sm text-text-secondary">Gerando codigo...</p>
            </>
          )}

          {/* PAIRING CODE */}
          {state === 'pairing' && pairingCode && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Hash className="h-8 w-8 text-accent" />
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm text-text-secondary">
                  Digite este codigo no seu WhatsApp:
                </p>
                <div className="rounded-[var(--radius-lg)] border-2 border-accent/30 bg-accent/5 px-6 py-4">
                  <p className="font-mono text-3xl font-bold tracking-[0.3em] text-text-primary">
                    {formattedPairingCode}
                  </p>
                </div>
              </div>

              <div className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary p-3">
                <p className="text-xs font-medium text-text-primary mb-1.5">Como conectar:</p>
                <ol className="list-inside list-decimal space-y-0.5 text-xs text-text-secondary">
                  <li>Abra o <strong>WhatsApp Business</strong></li>
                  <li>Vá em <strong>Configurações</strong> {'>'} <strong>Dispositivos Conectados</strong></li>
                  <li>Toque em <strong>Conectar Dispositivo</strong></li>
                  <li>Toque em <strong>&quot;Conectar com número de telefone&quot;</strong></li>
                  <li>Digite o codigo <strong>{formattedPairingCode}</strong></li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Spinner size="sm" />
                Aguardando conexao...
              </div>

              <button
                onClick={() => connect(true)}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <RefreshCcw className="h-3 w-3" />
                Gerar novo codigo
              </button>
            </>
          )}

          {/* QR CODE (fallback) */}
          {state === 'qr' && qrCode && (
            <>
              <div className="rounded-[var(--radius-lg)] border border-border bg-white p-3">
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
                <Spinner size="sm" />
                Aguardando conexao...
              </div>
              <button
                onClick={() => connect(false)}
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
                <Button onClick={onClose} className="flex-1">
                  Fechar
                </Button>
                <Button variant="danger" onClick={handleDisconnect}>
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </Button>
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
              <Button onClick={() => setState('idle')} className="w-full">
                Tentar Novamente
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
