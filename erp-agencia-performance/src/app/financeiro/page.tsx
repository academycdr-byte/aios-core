"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatCurrency, getStatusColor } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react"

type Tab = "visao-geral" | "contas-receber" | "pl"

interface DashboardData {
  receitaTotal: number
  clientesAtivos: number
  gastoMidiaTotal: number
  roasMedio: number
  receitaMensal: { mes: string; receita: number; custos: number }[]
  topClientes: { nome: string; receita: number }[]
  alerts: { tipo: string; mensagem: string }[]
}

interface ContaReceber {
  id: string
  clienteId: string
  cliente: { id: string; nome: string }
  descricao: string | null
  valor: number
  mes: string
  status: string
  dataPagamento: string | null
  createdAt: string
}

interface PlCliente {
  id: string
  nome: string
  receitaFees: number
  custoMidia: number
  lucro: number
  margem: number
}

interface PlData {
  clientes: PlCliente[]
  totals: { receitaFees: number; custoMidia: number; lucro: number; margem: number }
}

interface ClienteOption {
  id: string
  nome: string
}

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visao-geral")
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [plData, setPlData] = useState<PlData | null>(null)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Form state
  const [formClienteId, setFormClienteId] = useState("")
  const [formDescricao, setFormDescricao] = useState("")
  const [formValor, setFormValor] = useState("")
  const [formMes, setFormMes] = useState("")
  const [formStatus, setFormStatus] = useState("PENDENTE")

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/financeiro?dashboard=true")
      const data = await res.json()
      setDashboard(data)
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    }
  }, [])

  const fetchContas = useCallback(async () => {
    try {
      const url = statusFilter
        ? `/api/financeiro?status=${statusFilter}`
        : "/api/financeiro"
      const res = await fetch(url)
      const data = await res.json()
      setContas(data)
    } catch (error) {
      console.error("Failed to fetch contas:", error)
    }
  }, [statusFilter])

  const fetchPl = useCallback(async () => {
    try {
      const res = await fetch("/api/financeiro?pl=true")
      const data = await res.json()
      setPlData(data)
    } catch (error) {
      console.error("Failed to fetch P&L:", error)
    }
  }, [])

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes")
      const data = await res.json()
      setClientes(data)
    } catch (error) {
      console.error("Failed to fetch clientes:", error)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchDashboard(), fetchClientes()])
      setLoading(false)
    }
    load()
  }, [fetchDashboard, fetchClientes])

  useEffect(() => {
    if (activeTab === "contas-receber") fetchContas()
  }, [activeTab, fetchContas])

  useEffect(() => {
    if (activeTab === "pl") fetchPl()
  }, [activeTab, fetchPl])

  const resetForm = () => {
    setFormClienteId("")
    setFormDescricao("")
    setFormValor("")
    setFormMes("")
    setFormStatus("PENDENTE")
  }

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: formClienteId,
          descricao: formDescricao || null,
          valor: parseFloat(formValor),
          mes: formMes,
          status: formStatus,
        }),
      })
      if (res.ok) {
        setModalOpen(false)
        resetForm()
        fetchContas()
        fetchDashboard()
      }
    } catch (error) {
      console.error("Failed to create conta:", error)
    }
  }

  const handleMarkPago = async (id: string) => {
    try {
      const res = await fetch(`/api/financeiro?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAGO",
          dataPagamento: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        fetchContas()
        fetchDashboard()
      }
    } catch (error) {
      console.error("Failed to mark as pago:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/financeiro?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchContas()
        fetchDashboard()
      }
    } catch (error) {
      console.error("Failed to delete conta:", error)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "visao-geral", label: "Visão Geral" },
    { key: "contas-receber", label: "Contas a Receber" },
    { key: "pl", label: "P&L" },
  ]

  const getMargemColor = (margem: number) => {
    if (margem > 30) return "text-emerald-400"
    if (margem >= 15) return "text-amber-400"
    return "text-red-400"
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-bg-secondary animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-bg-secondary animate-pulse" />
        </div>
        <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-9 rounded-md bg-bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-bg-secondary animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 rounded bg-bg-secondary animate-pulse" />
                  <div className="h-6 w-28 rounded bg-bg-secondary animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Financeiro</h1>
        <p className="text-text-muted mt-1">Gestão financeira e P&L</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-bg-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== VISAO GERAL ==================== */}
      {activeTab === "visao-geral" && dashboard && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Receita Total</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(dashboard.receitaTotal)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Custos de Mídia</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(dashboard.gastoMidiaTotal)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Lucro Bruto</p>
                  <p className="text-xl font-bold text-text-primary">
                    {formatCurrency(dashboard.receitaTotal - dashboard.gastoMidiaTotal)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Percent className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Margem Média</p>
                  <p className="text-xl font-bold text-text-primary">
                    {dashboard.receitaTotal > 0
                      ? (
                          ((dashboard.receitaTotal - dashboard.gastoMidiaTotal) /
                            dashboard.receitaTotal) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              Receita vs Custos (Últimos 6 meses)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.receitaMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="mes"
                    stroke="#71717a"
                    fontSize={12}
                    tickFormatter={(v: string) => {
                      const [year, month] = v.split("-")
                      return `${month}/${year.slice(2)}`
                    }}
                  />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "receita" ? "Receita" : "Custos",
                    ]}
                    labelFormatter={(label: string) => {
                      const [year, month] = label.split("-")
                      return `${month}/${year}`
                    }}
                  />
                  <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Alerts & Top Clients side-by-side */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Clientes */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Top Clientes</h3>
              <div className="space-y-3">
                {dashboard.topClientes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary">{c.nome}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {formatCurrency(c.receita)}
                    </span>
                  </div>
                ))}
                {dashboard.topClientes.length === 0 && (
                  <p className="text-sm text-text-muted">Nenhum cliente encontrado</p>
                )}
              </div>
            </Card>

            {/* Alerts */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-text-primary">Alertas</h3>
              <div className="space-y-3">
                {dashboard.alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span className="text-sm text-text-secondary">{a.mensagem}</span>
                  </div>
                ))}
                {dashboard.alerts.length === 0 && (
                  <p className="text-sm text-text-muted">Nenhum alerta</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== CONTAS A RECEBER ==================== */}
      {activeTab === "contas-receber" && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Select
              options={[
                { value: "", label: "Todos os status" },
                { value: "PENDENTE", label: "Pendente" },
                { value: "PAGO", label: "Pago" },
                { value: "ATRASADO", label: "Atrasado" },
                { value: "CANCELADO", label: "Cancelado" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            />
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>

          {/* Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                      Data Pagamento
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((conta) => (
                    <tr key={conta.id} className="border-b border-border hover:bg-bg-hover">
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {conta.cliente.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {conta.descricao || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {formatCurrency(conta.valor)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{conta.mes}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(conta.status)}>{conta.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {conta.dataPagamento
                          ? new Date(conta.dataPagamento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {conta.status !== "PAGO" && (
                            <button
                              onClick={() => handleMarkPago(conta.id)}
                              className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(conta.id)}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {contas.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm text-text-muted"
                      >
                        Nenhuma conta encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Create Modal */}
          <Modal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              resetForm()
            }}
            title="Nova Conta a Receber"
          >
            <div className="space-y-4">
              <Select
                id="conta-cliente"
                label="Cliente"
                placeholder="Selecione o cliente"
                options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                value={formClienteId}
                onChange={(e) => setFormClienteId(e.target.value)}
              />
              <Input
                id="conta-descricao"
                label="Descrição"
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Fee mensal"
              />
              <Input
                id="conta-valor"
                label="Valor (R$)"
                type="number"
                step="0.01"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
                placeholder="0.00"
              />
              <Input
                id="conta-mes"
                label="Mês (AAAA-MM)"
                value={formMes}
                onChange={(e) => setFormMes(e.target.value)}
                placeholder="2025-01"
              />
              <Select
                id="conta-status"
                label="Status"
                options={[
                  { value: "PENDENTE", label: "Pendente" },
                  { value: "PAGO", label: "Pago" },
                  { value: "ATRASADO", label: "Atrasado" },
                ]}
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!formClienteId || !formValor || !formMes}>
                  Criar Conta
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ==================== P&L ==================== */}
      {activeTab === "pl" && plData && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Receita (Fees)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Custo Mídia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Lucro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Margem %
                  </th>
                </tr>
              </thead>
              <tbody>
                {plData.clientes.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-bg-hover">
                    <td className="px-6 py-4 text-sm text-text-primary">{c.nome}</td>
                    <td className="px-6 py-4 text-right text-sm text-text-primary">
                      {formatCurrency(c.receitaFees)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-text-secondary">
                      {formatCurrency(c.custoMidia)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-text-primary">
                      {formatCurrency(c.lucro)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${getMargemColor(c.margem)}`}>
                      {c.margem.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {plData.clientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                      Nenhum dado encontrado
                    </td>
                  </tr>
                )}
                {/* Totals row */}
                {plData.clientes.length > 0 && (
                  <tr className="border-t-2 border-border bg-bg-secondary">
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">TOTAL</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-text-primary">
                      {formatCurrency(plData.totals.receitaFees)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-text-secondary">
                      {formatCurrency(plData.totals.custoMidia)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-text-primary">
                      {formatCurrency(plData.totals.lucro)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-bold ${getMargemColor(plData.totals.margem)}`}
                    >
                      {plData.totals.margem.toFixed(1)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
