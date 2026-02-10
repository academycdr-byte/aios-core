"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/20 bg-red-500/10 text-red-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-400",
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[t.type]

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-in",
        STYLES[t.type]
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{t.message}</span>
      <button
        onClick={() => onRemove(t.id)}
        className="shrink-0 rounded p-0.5 hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
