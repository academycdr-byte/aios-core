"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Users } from "lucide-react"

const CARGO_LABELS: Record<string, string> = {
  GESTOR_CONTA: "Gestor de Conta",
  ANALISTA_MIDIA: "Analista de Mídia",
  DESIGNER: "Designer",
  COPYWRITER: "Copywriter",
}

const CARGO_OPTIONS = [
  { value: "GESTOR_CONTA", label: "Gestor de Conta" },
  { value: "ANALISTA_MIDIA", label: "Analista de Mídia" },
  { value: "DESIGNER", label: "Designer" },
  { value: "COPYWRITER", label: "Copywriter" },
]

const CARGO_COLORS: Record<string, string> = {
  GESTOR_CONTA: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ANALISTA_MIDIA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DESIGNER: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  COPYWRITER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

interface ClienteRef {
  id: string
  nome: string
  status: string
}

interface Membro {
  id: string
  userId: string
  cargo: string
  name: string
  email: string
  role: string
  createdAt: string
  clientesGerenciados: ClienteRef[]
  totalClientes: number
}

export default function EquipePage() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null)

  // Create form
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formCargo, setFormCargo] = useState("GESTOR_CONTA")
  const [formError, setFormError] = useState("")

  // Edit form
  const [editCargo, setEditCargo] = useState("")

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch("/api/equipe")
      const data = await res.json()
      setMembros(data)
    } catch (error) {
      console.error("Failed to fetch team:", error)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchMembros()
      setLoading(false)
    }
    load()
  }, [fetchMembros])

  const resetCreateForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormCargo("GESTOR_CONTA")
    setFormError("")
  }

  const handleCreate = async () => {
    setFormError("")
    try {
      const res = await fetch("/api/equipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          cargo: formCargo,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error || "Erro ao criar membro")
        return
      }

      setCreateModalOpen(false)
      resetCreateForm()
      fetchMembros()
    } catch (error) {
      console.error("Failed to create member:", error)
      setFormError("Erro ao criar membro")
    }
  }

  const handleEdit = (membro: Membro) => {
    setEditingMembro(membro)
    setEditCargo(membro.cargo)
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingMembro) return
    try {
      const res = await fetch(`/api/equipe/${editingMembro.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargo: editCargo }),
      })
      if (res.ok) {
        setEditModalOpen(false)
        setEditingMembro(null)
        fetchMembros()
      }
    } catch (error) {
      console.error("Failed to update member:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/equipe/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchMembros()
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-28 rounded-lg bg-bg-secondary animate-pulse" />
            <div className="h-4 w-24 rounded-lg bg-bg-secondary animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-bg-secondary animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 rounded bg-bg-secondary animate-pulse" />
                  <div className="h-3 w-36 rounded bg-bg-secondary animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-24 rounded-md bg-bg-secondary animate-pulse" />
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
          <h1 className="text-lg font-semibold text-text-primary">Equipe</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            {membros.length} {membros.length === 1 ? "membro" : "membros"}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Membro
        </Button>
      </div>

      {/* Grid */}
      {membros.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <Users className="mb-3 h-12 w-12 text-text-muted" />
          <p className="text-text-muted">Nenhum membro na equipe</p>
          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar membro
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {membros.map((membro) => (
            <Card key={membro.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                    <span className="text-sm font-bold text-accent">
                      {membro.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{membro.name}</h3>
                    <p className="text-sm text-text-muted">{membro.email}</p>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(membro)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                    title="Editar cargo"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(membro.id)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Excluir membro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Cargo Badge */}
              <div className="mt-3">
                <Badge className={CARGO_COLORS[membro.cargo] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
                  {CARGO_LABELS[membro.cargo] || membro.cargo}
                </Badge>
              </div>

              {/* Assigned Clients */}
              {membro.clientesGerenciados.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Clientes ({membro.totalClientes})
                  </p>
                  <div className="space-y-1">
                    {membro.clientesGerenciados.map((c) => (
                      <p key={c.id} className="text-sm text-text-secondary">
                        {c.nome}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {membro.clientesGerenciados.length === 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-text-muted">Nenhum cliente atribuído</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          resetCreateForm()
        }}
        title="Novo Membro da Equipe"
      >
        <div className="space-y-4">
          {formError && (
            <div className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {formError}
            </div>
          )}
          <Input
            id="membro-name"
            label="Nome"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nome completo"
          />
          <Input
            id="membro-email"
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="email@agencia.com"
          />
          <Input
            id="membro-password"
            label="Senha"
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Select
            id="membro-cargo"
            label="Cargo"
            options={CARGO_OPTIONS}
            value={formCargo}
            onChange={(e) => setFormCargo(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCreateModalOpen(false)
                resetCreateForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName || !formEmail || !formPassword || formPassword.length < 6}
            >
              Criar Membro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingMembro(null)
        }}
        title="Editar Cargo"
      >
        <div className="space-y-4">
          {editingMembro && (
            <div className="rounded-lg bg-bg-secondary p-3">
              <p className="text-sm text-text-primary">{editingMembro.name}</p>
              <p className="text-xs text-text-muted">{editingMembro.email}</p>
            </div>
          )}
          <Select
            id="edit-cargo"
            label="Cargo"
            options={CARGO_OPTIONS}
            value={editCargo}
            onChange={(e) => setEditCargo(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditModalOpen(false)
                setEditingMembro(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
