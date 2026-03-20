'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ImagePlus,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Textarea, Badge } from '@/components/ui'

interface StoreImage {
  id: string
  name: string
  description: string
  triggerContext: string
  category: string
  imageUrl: string
  isActive: boolean
  createdAt: string
}

interface ImageLibraryPanelProps {
  storeId: string
}

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'quality', label: 'Qualidade' },
  { value: 'sizing', label: 'Tamanhos' },
  { value: 'authenticity', label: 'Autenticidade' },
  { value: 'product', label: 'Produto' },
  { value: 'shipping', label: 'Envio' },
  { value: 'warranty', label: 'Garantia' },
]

export function ImageLibraryPanel({ storeId }: ImageLibraryPanelProps) {
  const [images, setImages] = useState<StoreImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTrigger, setFormTrigger] = useState('')
  const [formCategory, setFormCategory] = useState('general')

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/images`)
      const json = await res.json()
      if (json.data) setImages(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  async function handleAdd() {
    if (!formName.trim() || !formUrl.trim() || !formTrigger.trim()) {
      setError('Preencha nome, URL e contexto de envio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/stores/${storeId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          imageUrl: formUrl,
          description: formDescription,
          triggerContext: formTrigger,
          category: formCategory,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || 'Erro ao salvar')
      } else {
        setImages((prev) => [json.data, ...prev])
        resetForm()
        setShowForm(false)
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(imageId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/stores/${storeId}/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, isActive: !currentActive } : img))
        )
      }
    } catch {
      // silent
    }
  }

  async function handleDelete(imageId: string) {
    try {
      const res = await fetch(`/api/stores/${storeId}/images/${imageId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId))
      }
    } catch {
      // silent
    }
  }

  function resetForm() {
    setFormName('')
    setFormUrl('')
    setFormDescription('')
    setFormTrigger('')
    setFormCategory('general')
    setError(null)
  }

  const activeCount = images.filter((img) => img.isActive).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-purple-500/10">
              <ImagePlus className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Biblioteca de Imagens da IA
              </h3>
              <p className="text-xs text-text-tertiary">
                {activeCount} {activeCount === 1 ? 'imagem ativa' : 'imagens ativas'} — a IA envia automaticamente quando relevante
              </p>
            </div>
          </div>
          <Button onClick={() => { setShowForm(!showForm); resetForm() }} variant={showForm ? 'secondary' : 'primary'} size="sm">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Adicionar Imagem'}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-[var(--radius-lg)] border border-dashed border-purple-500/30 bg-purple-500/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
          Como funciona
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-text-secondary">Você adiciona imagens</span>
          </div>
          <span className="text-text-tertiary">→</span>
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-text-secondary">IA analisa o contexto</span>
          </div>
          <span className="text-text-tertiary">→</span>
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <ImagePlus className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-text-secondary">Envia a foto certa via WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="animate-fade-in rounded-[var(--radius-lg)] border border-accent/30 bg-accent/5 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-text-primary">Nova Imagem</h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Nome da Imagem *</label>
              <Input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Etiqueta de autenticidade"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Categoria</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">URL da Imagem *</label>
            <Input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://cdn.shopify.com/s/files/.../produto-detalhe.jpg"
            />
            <p className="mt-1 text-[10px] text-text-tertiary">
              Cole o link direto da imagem (Shopify, CDN, Google Drive público, etc.)
            </p>
          </div>

          {/* Image preview */}
          {formUrl && (
            <div className="flex justify-center">
              <img
                src={formUrl}
                alt="Preview"
                className="max-h-40 rounded-[var(--radius-md)] border border-border object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Descrição</label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Ex: Foto em close da etiqueta oficial mostrando holograma de autenticidade"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Quando a IA deve enviar? *</label>
            <Textarea
              value={formTrigger}
              onChange={(e) => setFormTrigger(e.target.value)}
              rows={2}
              placeholder="Ex: Quando o cliente perguntar se o produto é original ou tiver dúvidas sobre autenticidade"
            />
            <p className="mt-1 text-[10px] text-text-tertiary">
              Descreva o contexto da conversa em que essa imagem deve ser enviada. Seja específico!
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-error/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleAdd} loading={saving}>
              <ImagePlus className="h-4 w-4" />
              Adicionar à Biblioteca
            </Button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border py-12">
          <ImageIcon className="h-10 w-10 text-text-tertiary/40" />
          <p className="mt-3 text-sm font-medium text-text-secondary">
            Nenhuma imagem na biblioteca
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Adicione fotos de produtos, etiquetas, tabelas de tamanho, etc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                'group rounded-[var(--radius-lg)] border bg-surface overflow-hidden transition-all',
                img.isActive ? 'border-border hover:border-border-hover' : 'border-border opacity-50'
              )}
            >
              {/* Image Preview */}
              <div className="relative h-36 bg-bg-tertiary">
                <img
                  src={img.imageUrl}
                  alt={img.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleToggle(img.id, img.isActive)}
                    className="rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
                    title={img.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {img.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="rounded-full bg-red-500/20 p-2 text-red-400 backdrop-blur-sm hover:bg-red-500/30"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* Category badge */}
                <div className="absolute left-2 top-2">
                  <Badge variant="neutral" size="sm">
                    {CATEGORIES.find((c) => c.value === img.category)?.label ?? img.category}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h4 className="text-sm font-medium text-text-primary truncate">{img.name}</h4>
                {img.description && (
                  <p className="mt-0.5 text-xs text-text-tertiary line-clamp-1">{img.description}</p>
                )}
                <div className="mt-2 flex items-start gap-1.5">
                  <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-accent" />
                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {img.triggerContext}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
