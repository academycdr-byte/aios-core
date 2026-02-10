"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { getPrioridadeColor } from "@/lib/utils"
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from "lucide-react"

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  clienteId: string | null
  responsavelId: string | null
  prazo: string | null
  createdAt: string
  cliente: { id: string; nome: string } | null
  responsavel: { id: string; name: string; email: string } | null
}

interface ClienteOption {
  id: string
  nome: string
}

interface UserOption {
  id: string
  name: string
}

interface TarefaForm {
  titulo: string
  descricao: string
  prioridade: string
  status: string
  clienteId: string
  responsavelId: string
  prazo: string
}

const emptyForm: TarefaForm = {
  titulo: "",
  descricao: "",
  prioridade: "MEDIA",
  status: "A_FAZER",
  clienteId: "",
  responsavelId: "",
  prazo: "",
}

const STATUS_COLUMNS = [
  { key: "A_FAZER", label: "A Fazer", borderColor: "border-t-zinc-500" },
  { key: "FAZENDO", label: "Fazendo", borderColor: "border-t-accent" },
  { key: "FEITO", label: "Feito", borderColor: "border-t-emerald-500" },
] as const

const PRIORIDADE_OPTIONS = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
]

const STATUS_OPTIONS = [
  { value: "A_FAZER", label: "A Fazer" },
  { value: "FAZENDO", label: "Fazendo" },
  { value: "FEITO", label: "Feito" },
]

function getPrioridadeLabel(prioridade: string): string {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  }
  return labels[prioridade] || prioridade
}

function isOverdue(prazo: string | null): boolean {
  if (!prazo) return false
  return new Date(prazo) < new Date()
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClienteId, setFilterClienteId] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TarefaForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadTarefas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterClienteId) params.set("clienteId", filterClienteId)

      const res = await fetch(`/api/tarefas?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTarefas(data)
      }
    } catch {
      // silently handle
    }
  }, [filterClienteId])

  const loadOptions = useCallback(async () => {
    try {
      const [clientesRes, equipeRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/equipe"),
      ])
      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(data.map((c: ClienteOption) => ({ id: c.id, nome: c.nome })))
      }
      if (equipeRes.ok) {
        const data = await equipeRes.json()
        setUsers(
          data.map((m: { userId: string; name: string }) => ({
            id: m.userId,
            name: m.name,
          }))
        )
      }
    } catch {
      // silently handle
    }
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadTarefas(), loadOptions()])
      setLoading(false)
    }
    init()
  }, [loadTarefas, loadOptions])

  const openCreateModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (tarefa: Tarefa) => {
    setEditingId(tarefa.id)
    setForm({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || "",
      prioridade: tarefa.prioridade,
      status: tarefa.status,
      clienteId: tarefa.clienteId || "",
      responsavelId: tarefa.responsavelId || "",
      prazo: tarefa.prazo ? tarefa.prazo.slice(0, 10) : "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) return
    setSaving(true)

    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        prioridade: form.prioridade,
        status: form.status,
        clienteId: form.clienteId || null,
        responsavelId: form.responsavelId || null,
        prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
      }

      const url = editingId ? `/api/tarefas/${editingId}` : "/api/tarefas"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setModalOpen(false)
        setForm(emptyForm)
        setEditingId(null)
        await loadTarefas()
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (tarefaId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setTarefas((prev) =>
          prev.map((t) => (t.id === tarefaId ? { ...t, status: newStatus } : t))
        )
      }
    } catch {
      // silently handle
    }
  }

  const handleDelete = async (tarefaId: string) => {
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`, { method: "DELETE" })
      if (res.ok) {
        setTarefas((prev) => prev.filter((t) => t.id !== tarefaId))
        setModalOpen(false)
      }
    } catch {
      // silently handle
    }
  }

  const getColumnTarefas = (status: string) =>
    tarefas.filter((t) => t.status === status)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tarefas</h1>
          <p className="text-sm text-text-muted">
            Gerencie as tarefas da sua equipe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "", label: "Todos os clientes" },
              ...clientes.map((c) => ({ value: c.id, label: c.nome })),
            ]}
            value={filterClienteId}
            onChange={(e) => setFilterClienteId(e.target.value)}
            className="w-48"
          />
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {STATUS_COLUMNS.map((column) => {
          const columnTarefas = getColumnTarefas(column.key)

          return (
            <div
              key={column.key}
              className="flex min-w-[300px] flex-1 flex-col"
            >
              {/* Column Header */}
              <div
                className={`mb-3 rounded-t-lg border-t-2 ${column.borderColor} bg-bg-secondary px-4 py-3`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">
                    {column.label}
                  </h2>
                  <Badge className="bg-bg-card text-text-muted border-border">
                    {columnTarefas.length}
                  </Badge>
                </div>
              </div>

              {/* Column Cards */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-b-lg bg-bg-secondary/50 p-2"
                style={{ maxHeight: "calc(100vh - 280px)" }}
              >
                {columnTarefas.length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
                    <p className="text-sm text-text-muted">
                      Nenhuma tarefa
                    </p>
                  </div>
                )}

                {columnTarefas.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="group cursor-pointer rounded-lg border border-border bg-bg-card p-4 transition-colors hover:border-border-hover"
                    onClick={() => openEditModal(tarefa)}
                  >
                    {/* Title */}
                    <h3 className="font-medium text-text-primary">
                      {tarefa.titulo}
                    </h3>

                    {/* Description Preview */}
                    {tarefa.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                        {tarefa.descricao}
                      </p>
                    )}

                    {/* Due Date */}
                    {tarefa.prazo && (
                      <div
                        className={`mt-2 flex items-center gap-1 text-xs ${
                          isOverdue(tarefa.prazo) && tarefa.status !== "FEITO"
                            ? "text-danger"
                            : "text-text-muted"
                        }`}
                      >
                        <Calendar size={12} />
                        <span>
                          {formatDate(tarefa.prazo)}
                          {isOverdue(tarefa.prazo) && tarefa.status !== "FEITO" && " (atrasada)"}
                        </span>
                      </div>
                    )}

                    {/* Bottom Row: Priority + Client + Responsável */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getPrioridadeColor(tarefa.prioridade)}>
                          {getPrioridadeLabel(tarefa.prioridade)}
                        </Badge>
                        {tarefa.cliente && (
                          <span className="text-xs text-text-muted">
                            {tarefa.cliente.nome}
                          </span>
                        )}
                      </div>

                      {tarefa.responsavel && (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent"
                          title={tarefa.responsavel.name}
                        >
                          {getInitials(tarefa.responsavel.name)}
                        </div>
                      )}
                    </div>

                    {/* Move Buttons */}
                    <div
                      className="mt-3 flex items-center gap-2 border-t border-border pt-3 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {column.key === "FAZENDO" && (
                        <button
                          onClick={() => handleStatusChange(tarefa.id, "A_FAZER")}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                          title="Mover para A Fazer"
                        >
                          <ChevronLeft size={14} />
                          A Fazer
                        </button>
                      )}

                      {column.key === "FEITO" && (
                        <button
                          onClick={() => handleStatusChange(tarefa.id, "FAZENDO")}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                          title="Mover para Fazendo"
                        >
                          <ChevronLeft size={14} />
                          Fazendo
                        </button>
                      )}

                      <div className="flex-1" />

                      {column.key === "A_FAZER" && (
                        <button
                          onClick={() => handleStatusChange(tarefa.id, "FAZENDO")}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                          title="Mover para Fazendo"
                        >
                          Fazendo
                          <ChevronRight size={14} />
                        </button>
                      )}

                      {column.key === "FAZENDO" && (
                        <button
                          onClick={() => handleStatusChange(tarefa.id, "FEITO")}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                          title="Mover para Feito"
                        >
                          Feito
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingId(null)
          setForm(emptyForm)
        }}
        title={editingId ? "Editar Tarefa" : "Nova Tarefa"}
      >
        <div className="space-y-4">
          <Input
            label="Título"
            id="titulo"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título da tarefa"
            required
          />

          <div className="space-y-1.5">
            <label
              htmlFor="descricao"
              className="block text-sm font-medium text-text-secondary"
            >
              Descrição
            </label>
            <textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva a tarefa..."
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Prioridade"
              id="prioridade"
              options={PRIORIDADE_OPTIONS}
              value={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
            />

            <Select
              label="Status"
              id="status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cliente"
              id="clienteId"
              placeholder="Selecionar cliente"
              options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            />

            <Select
              label="Responsável"
              id="responsavelId"
              placeholder="Selecionar responsável"
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              value={form.responsavelId}
              onChange={(e) =>
                setForm({ ...form, responsavelId: e.target.value })
              }
            />
          </div>

          <Input
            label="Prazo"
            id="prazo"
            type="date"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
          />

          <div className="flex items-center justify-between pt-2">
            <div>
              {editingId && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(editingId)}
                >
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(false)
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.titulo.trim()}>
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
