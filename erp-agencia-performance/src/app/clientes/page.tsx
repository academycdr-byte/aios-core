"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getStatusColor } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2, Users as UsersIcon } from "lucide-react"

interface Gestor {
  id: string
  name: string
  email: string
}

interface Cliente {
  id: string
  nome: string
  cnpj: string | null
  segmento: string | null
  contato: string | null
  email: string | null
  telefone: string | null
  plataforma: string | null
  urlLoja: string | null
  status: string
  feeMensal: number | null
  modeloCobranca: string
  gestorId: string | null
  gestor: Gestor | null
  createdAt: string
}

interface FormData {
  nome: string
  cnpj: string
  segmento: string
  contato: string
  email: string
  telefone: string
  plataforma: string
  urlLoja: string
  status: string
  feeMensal: string
  modeloCobranca: string
  gestorId: string
}

const EMPTY_FORM: FormData = {
  nome: "",
  cnpj: "",
  segmento: "",
  contato: "",
  email: "",
  telefone: "",
  plataforma: "",
  urlLoja: "",
  status: "ATIVO",
  feeMensal: "",
  modeloCobranca: "FIXO",
  gestorId: "",
}

const STATUS_TABS = ["Todos", "ATIVO", "PAUSADO", "CHURN"] as const

const PLATAFORMA_OPTIONS = [
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WOOCOMMERCE", label: "WooCommerce" },
  { value: "VTEX", label: "VTEX" },
  { value: "NUVEMSHOP", label: "Nuvemshop" },
  { value: "OUTRA", label: "Outra" },
]

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "CHURN", label: "Churn" },
]

const MODELO_OPTIONS = [
  { value: "FIXO", label: "Fixo" },
  { value: "PERCENTUAL", label: "Percentual" },
  { value: "HIBRIDO", label: "Híbrido" },
]

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("Todos")
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setClientes(data)
    } catch {
      setError("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGestores = useCallback(async () => {
    try {
      const res = await fetch("/api/register")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setGestores(data)
      }
    } catch {
      // Gestores list is optional
    }
  }, [])

  useEffect(() => {
    fetchClientes()
    fetchGestores()
  }, [fetchClientes, fetchGestores])

  const filteredClientes = clientes.filter((c) => {
    const matchesTab = activeTab === "Todos" || c.status === activeTab
    const matchesSearch =
      search === "" ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(search)) ||
      (c.segmento && c.segmento.toLowerCase().includes(search.toLowerCase()))
    return matchesTab && matchesSearch
  })

  const counts = {
    Todos: clientes.length,
    ATIVO: clientes.filter((c) => c.status === "ATIVO").length,
    PAUSADO: clientes.filter((c) => c.status === "PAUSADO").length,
    CHURN: clientes.filter((c) => c.status === "CHURN").length,
  }

  function openCreateModal() {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setError("")
    setModalOpen(true)
  }

  function openEditModal(cliente: Cliente) {
    setEditingId(cliente.id)
    setFormData({
      nome: cliente.nome,
      cnpj: cliente.cnpj || "",
      segmento: cliente.segmento || "",
      contato: cliente.contato || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      plataforma: cliente.plataforma || "",
      urlLoja: cliente.urlLoja || "",
      status: cliente.status,
      feeMensal: cliente.feeMensal != null ? String(cliente.feeMensal) : "",
      modeloCobranca: cliente.modeloCobranca,
      gestorId: cliente.gestorId || "",
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
        cnpj: formData.cnpj || null,
        segmento: formData.segmento || null,
        contato: formData.contato || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        plataforma: formData.plataforma || null,
        urlLoja: formData.urlLoja || null,
        status: formData.status,
        feeMensal: formData.feeMensal ? parseFloat(formData.feeMensal) : null,
        modeloCobranca: formData.modeloCobranca,
        gestorId: formData.gestorId || null,
      }

      const url = editingId ? `/api/clientes/${editingId}` : "/api/clientes"
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
      fetchClientes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cliente")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/clientes/${deletingId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao remover")
      }
      setDeleteModalOpen(false)
      setDeletingId(null)
      fetchClientes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover cliente")
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
            <div className="h-7 w-32 rounded-lg bg-bg-secondary animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-bg-secondary animate-pulse" />
          </div>
          <div className="h-9 w-32 rounded-lg bg-bg-secondary animate-pulse" />
        </div>
        <div className="h-10 w-72 rounded-lg bg-bg-secondary animate-pulse" />
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4">
              <div className="h-4 w-32 rounded bg-bg-secondary animate-pulse" />
              <div className="h-4 w-24 rounded bg-bg-secondary animate-pulse" />
              <div className="h-4 w-20 rounded bg-bg-secondary animate-pulse" />
              <div className="h-4 w-16 rounded bg-bg-secondary animate-pulse" />
              <div className="h-5 w-14 rounded-md bg-bg-secondary animate-pulse" />
              <div className="h-4 w-20 rounded bg-bg-secondary animate-pulse flex-1" />
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
          <h1 className="text-2xl font-bold text-text-primary">Clientes</h1>
          <p className="text-sm text-text-muted mt-1">
            Gerencie sua carteira de clientes
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou segmento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-secondary pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab === "Todos" ? "Todos" : tab}
            <span className="ml-2 rounded-full bg-bg-secondary px-2 py-0.5 text-xs">
              {counts[tab as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredClientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-16">
          <UsersIcon size={40} className="text-text-muted/50 mb-3" />
          <p className="text-text-muted text-sm">
            {search ? "Nenhum cliente encontrado para esta busca" : "Nenhum cliente cadastrado"}
          </p>
          {!search && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={openCreateModal}>
              <Plus size={14} />
              Adicionar primeiro cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Segmento</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Plataforma</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Fee Mensal</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Gestor</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  onClick={() => router.push(`/clientes/${cliente.id}`)}
                  className="border-b border-border hover:bg-bg-hover cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{cliente.nome}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{cliente.cnpj || "-"}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{cliente.segmento || "-"}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{cliente.plataforma || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(cliente.status)}>{cliente.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {cliente.feeMensal != null ? formatCurrency(cliente.feeMensal) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{cliente.gestor?.name || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(cliente)
                        }}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteModal(cliente.id)
                        }}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Cliente" : "Novo Cliente"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-sm text-danger">
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
            <Input
              id="cnpj"
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
            />
            <Input
              id="segmento"
              label="Segmento"
              value={formData.segmento}
              onChange={(e) => updateField("segmento", e.target.value)}
            />
            <Input
              id="contato"
              label="Contato"
              value={formData.contato}
              onChange={(e) => updateField("contato", e.target.value)}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            <Input
              id="telefone"
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => updateField("telefone", e.target.value)}
            />
            <Select
              id="plataforma"
              label="Plataforma"
              value={formData.plataforma}
              onChange={(e) => updateField("plataforma", e.target.value)}
              options={PLATAFORMA_OPTIONS}
              placeholder="Selecione..."
            />
            <Input
              id="urlLoja"
              label="URL da Loja"
              value={formData.urlLoja}
              onChange={(e) => updateField("urlLoja", e.target.value)}
            />
            <Select
              id="status"
              label="Status"
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Input
              id="feeMensal"
              label="Fee Mensal (R$)"
              type="number"
              step="0.01"
              min="0"
              value={formData.feeMensal}
              onChange={(e) => updateField("feeMensal", e.target.value)}
            />
            <Select
              id="modeloCobranca"
              label="Modelo de Cobrança"
              value={formData.modeloCobranca}
              onChange={(e) => updateField("modeloCobranca", e.target.value)}
              options={MODELO_OPTIONS}
            />
            <Select
              id="gestorId"
              label="Gestor"
              value={formData.gestorId}
              onChange={(e) => updateField("gestorId", e.target.value)}
              options={gestores.map((g) => ({ value: g.id, label: g.name }))}
              placeholder="Selecione..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : editingId ? "Salvar" : "Criar Cliente"}
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
          Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita.
          Todas as campanhas e contas a receber associadas também serão removidas.
        </p>
        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-sm text-danger mb-4">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? "Removendo..." : "Remover Cliente"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
