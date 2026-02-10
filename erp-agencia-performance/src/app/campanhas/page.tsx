"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import {
  formatCurrency,
  formatNumber,
  getStatusColor,
  calcCTR,
  calcROAS,
} from "@/lib/utils"
import { Plus, Pencil, Trash2, Megaphone as MegaphoneIcon } from "lucide-react"

interface ClienteRef {
  id: string
  nome: string
}

interface Campanha {
  id: string
  nome: string
  clienteId: string
  cliente: ClienteRef
  plataforma: string
  budgetPlanejado: number
  gastoReal: number
  impressoes: number
  cliques: number
  conversoes: number
  receita: number
  mes: string
  status: string
  createdAt: string
}

interface FormData {
  nome: string
  clienteId: string
  plataforma: string
  budgetPlanejado: string
  gastoReal: string
  impressoes: string
  cliques: string
  conversoes: string
  receita: string
  mes: string
  status: string
}

const EMPTY_FORM: FormData = {
  nome: "",
  clienteId: "",
  plataforma: "META_ADS",
  budgetPlanejado: "",
  gastoReal: "0",
  impressoes: "0",
  cliques: "0",
  conversoes: "0",
  receita: "0",
  mes: new Date().toISOString().slice(0, 7),
  status: "ATIVA",
}

const PLATAFORMA_OPTIONS = [
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "TIKTOK_ADS", label: "TikTok Ads" },
]

const STATUS_OPTIONS = [
  { value: "ATIVA", label: "Ativa" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "FINALIZADA", label: "Finalizada" },
]

const PLATAFORMA_COLORS: Record<string, string> = {
  META_ADS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  GOOGLE_ADS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  TIKTOK_ADS: "bg-pink-500/10 text-pink-400 border-pink-500/20",
}

function getRoasColor(roas: number): string {
  if (roas >= 3) return "text-emerald-400"
  if (roas >= 2) return "text-amber-400"
  return "text-red-400"
}

function getBudgetUsageColor(gastoReal: number, budget: number): string {
  if (budget === 0) return "text-text-secondary"
  const usage = (gastoReal / budget) * 100
  if (usage > 100) return "text-red-400"
  if (usage >= 80) return "text-amber-400"
  return "text-emerald-400"
}

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [clientes, setClientes] = useState<ClienteRef[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlataforma, setFilterPlataforma] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchCampanhas = useCallback(async () => {
    try {
      const res = await fetch("/api/campanhas")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setCampanhas(data)
    } catch {
      setError("Erro ao carregar campanhas")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes")
      if (!res.ok) return
      const data = await res.json()
      setClientes(data.map((c: ClienteRef & Record<string, unknown>) => ({ id: c.id, nome: c.nome })))
    } catch {
      // Client list is optional for filtering
    }
  }, [])

  useEffect(() => {
    fetchCampanhas()
    fetchClientes()
  }, [fetchCampanhas, fetchClientes])

  const filteredCampanhas = campanhas.filter((c) => {
    const matchesPlat = !filterPlataforma || c.plataforma === filterPlataforma
    const matchesStatus = !filterStatus || c.status === filterStatus
    return matchesPlat && matchesStatus
  })

  function openCreateModal() {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setError("")
    setModalOpen(true)
  }

  function openEditModal(campanha: Campanha) {
    setEditingId(campanha.id)
    setFormData({
      nome: campanha.nome,
      clienteId: campanha.clienteId,
      plataforma: campanha.plataforma,
      budgetPlanejado: String(campanha.budgetPlanejado),
      gastoReal: String(campanha.gastoReal),
      impressoes: String(campanha.impressoes),
      cliques: String(campanha.cliques),
      conversoes: String(campanha.conversoes),
      receita: String(campanha.receita),
      mes: campanha.mes,
      status: campanha.status,
    })
    setError("")
    setModalOpen(true)
  }

  function openDeleteModal(id: string) {
    setDeletingId(id)
    setDeleteModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const payload = {
        nome: formData.nome,
        clienteId: formData.clienteId,
        plataforma: formData.plataforma,
        budgetPlanejado: parseFloat(formData.budgetPlanejado) || 0,
        gastoReal: parseFloat(formData.gastoReal) || 0,
        impressoes: parseInt(formData.impressoes) || 0,
        cliques: parseInt(formData.cliques) || 0,
        conversoes: parseInt(formData.conversoes) || 0,
        receita: parseFloat(formData.receita) || 0,
        mes: formData.mes,
        status: formData.status,
      }

      const url = editingId ? `/api/campanhas/${editingId}` : "/api/campanhas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao salvar")
      }

      setModalOpen(false)
      fetchCampanhas()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar campanha")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/campanhas/${deletingId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao remover")
      }
      setDeleteModalOpen(false)
      setDeletingId(null)
      fetchCampanhas()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover campanha")
    } finally {
      setSubmitting(false)
    }
  }

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-36 rounded-lg bg-bg-secondary animate-pulse" />
            <div className="h-4 w-52 rounded-lg bg-bg-secondary animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-bg-secondary animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-48 rounded-lg bg-bg-secondary animate-pulse" />
          <div className="h-9 w-48 rounded-lg bg-bg-secondary animate-pulse" />
        </div>
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4">
              <div className="h-4 w-28 rounded bg-bg-secondary animate-pulse" />
              <div className="h-4 w-24 rounded bg-bg-secondary animate-pulse" />
              <div className="h-5 w-20 rounded-md bg-bg-secondary animate-pulse" />
              <div className="h-4 w-20 rounded bg-bg-secondary animate-pulse" />
              <div className="h-4 w-16 rounded bg-bg-secondary animate-pulse flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Campanhas</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Gerencie campanhas de mídia paga
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Nova Campanha
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          id="filterPlataforma"
          value={filterPlataforma}
          onChange={(e) => setFilterPlataforma(e.target.value)}
          options={PLATAFORMA_OPTIONS}
          placeholder="Todas Plataformas"
          className="w-48"
        />
        <Select
          id="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={STATUS_OPTIONS}
          placeholder="Todos Status"
          className="w-48"
        />
        {(filterPlataforma || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterPlataforma("")
              setFilterStatus("")
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredCampanhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-16">
          <MegaphoneIcon size={40} className="text-text-muted/50 mb-3" />
          <p className="text-text-muted text-[13px]">
            {filterPlataforma || filterStatus
              ? "Nenhuma campanha encontrada com estes filtros"
              : "Nenhuma campanha cadastrada"}
          </p>
          {!filterPlataforma && !filterStatus && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={openCreateModal}>
              <Plus size={14} />
              Criar primeira campanha
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Nome</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Cliente</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Plataforma</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">Budget</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">Gasto Real</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">Impressões</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">Cliques</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">CTR</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">ROAS</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampanhas.map((campanha) => {
                const ctr = calcCTR(campanha.cliques, campanha.impressoes)
                const roas = calcROAS(campanha.receita, campanha.gastoReal)
                return (
                  <tr
                    key={campanha.id}
                    className="border-b border-border hover:bg-bg-hover transition-colors"
                  >
                    <td className="px-4 py-2.5 text-[13px] font-medium text-text-primary">{campanha.nome}</td>
                    <td className="px-4 py-2.5 text-[13px] text-text-secondary">{campanha.cliente?.nome || "-"}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={PLATAFORMA_COLORS[campanha.plataforma] || ""}>
                        {campanha.plataforma.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-text-secondary text-right">
                      {formatCurrency(campanha.budgetPlanejado)}
                    </td>
                    <td className={`px-4 py-2.5 text-[13px] text-right font-medium ${getBudgetUsageColor(campanha.gastoReal, campanha.budgetPlanejado)}`}>
                      {formatCurrency(campanha.gastoReal)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-text-secondary text-right">
                      {formatNumber(campanha.impressoes)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-text-secondary text-right">
                      {formatNumber(campanha.cliques)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-text-secondary text-right">
                      {ctr.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-[13px] font-medium ${getRoasColor(roas)}`}>
                        {roas.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={getStatusColor(campanha.status)}>{campanha.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(campanha)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(campanha.id)}
                          className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Campanha" : "Nova Campanha"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="nome"
              label="Nome *"
              value={formData.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              required
            />
            <Select
              id="clienteId"
              label="Cliente *"
              value={formData.clienteId}
              onChange={(e) => updateField("clienteId", e.target.value)}
              options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              placeholder="Selecione o cliente..."
            />
            <Select
              id="plataforma"
              label="Plataforma *"
              value={formData.plataforma}
              onChange={(e) => updateField("plataforma", e.target.value)}
              options={PLATAFORMA_OPTIONS}
            />
            <Input
              id="budgetPlanejado"
              label="Budget Planejado (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.budgetPlanejado}
              onChange={(e) => updateField("budgetPlanejado", e.target.value)}
              required
            />
            <Input
              id="gastoReal"
              label="Gasto Real (R$)"
              type="number"
              step="0.01"
              min="0"
              value={formData.gastoReal}
              onChange={(e) => updateField("gastoReal", e.target.value)}
            />
            <Input
              id="impressoes"
              label="Impressões"
              type="number"
              min="0"
              value={formData.impressoes}
              onChange={(e) => updateField("impressoes", e.target.value)}
            />
            <Input
              id="cliques"
              label="Cliques"
              type="number"
              min="0"
              value={formData.cliques}
              onChange={(e) => updateField("cliques", e.target.value)}
            />
            <Input
              id="conversoes"
              label="Conversões"
              type="number"
              min="0"
              value={formData.conversoes}
              onChange={(e) => updateField("conversoes", e.target.value)}
            />
            <Input
              id="receita"
              label="Receita (R$)"
              type="number"
              step="0.01"
              min="0"
              value={formData.receita}
              onChange={(e) => updateField("receita", e.target.value)}
            />
            <Input
              id="mes"
              label="Mês *"
              type="month"
              value={formData.mes}
              onChange={(e) => updateField("mes", e.target.value)}
              required
            />
            <Select
              id="status"
              label="Status"
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar" : "Criar Campanha"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <p className="text-sm text-text-secondary mb-6">
          Tem certeza que deseja remover esta campanha? Esta ação não pode ser desfeita.
        </p>
        {error && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? "Removendo..." : "Remover Campanha"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
