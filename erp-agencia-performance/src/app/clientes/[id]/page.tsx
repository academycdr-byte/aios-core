"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  formatCurrency,
  formatNumber,
  getStatusColor,
  calcCTR,
  calcROAS,
} from "@/lib/utils"
import { ArrowLeft, Pencil, Globe, Mail, Phone, User, Building } from "lucide-react"

interface Gestor {
  id: string
  name: string
  email: string
}

interface Campanha {
  id: string
  nome: string
  plataforma: string
  budgetPlanejado: number
  gastoReal: number
  impressoes: number
  cliques: number
  conversoes: number
  receita: number
  mes: string
  status: string
}

interface ContaReceber {
  id: string
  descricao: string | null
  valor: number
  mes: string
  status: string
  dataPagamento: string | null
}

interface ClienteDetail {
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
  gestor: Gestor | null
  campanhas: Campanha[]
  contasReceber: ContaReceber[]
  createdAt: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClienteDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [cliente, setCliente] = useState<ClienteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"campanhas" | "financeiro">("campanhas")

  useEffect(() => {
    async function fetchCliente() {
      try {
        const res = await fetch(`/api/clientes/${id}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        setCliente(data)
      } catch {
        setCliente(null)
      } finally {
        setLoading(false)
      }
    }
    fetchCliente()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted">Carregando cliente...</div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-text-muted">Cliente não encontrado</p>
        <Button variant="secondary" onClick={() => router.push("/clientes")}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </div>
    )
  }

  const totalReceita = cliente.campanhas.reduce((sum, c) => sum + c.receita, 0)
  const totalGasto = cliente.campanhas.reduce((sum, c) => sum + c.gastoReal, 0)
  const totalPendente = cliente.contasReceber
    .filter((cr) => cr.status === "PENDENTE" || cr.status === "ATRASADO")
    .reduce((sum, cr) => sum + cr.valor, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/clientes")}
            className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{cliente.nome}</h1>
              <Badge className={getStatusColor(cliente.status)}>{cliente.status}</Badge>
            </div>
            {cliente.segmento && (
              <p className="text-sm text-text-muted mt-1">{cliente.segmento}</p>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={() => router.push("/clientes")}>
          <Pencil size={14} />
          Editar
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact */}
        <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Contato</h3>
          <div className="space-y-2">
            {cliente.contato && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User size={14} className="text-text-muted" />
                {cliente.contato}
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Mail size={14} className="text-text-muted" />
                {cliente.email}
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone size={14} className="text-text-muted" />
                {cliente.telefone}
              </div>
            )}
            {cliente.cnpj && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Building size={14} className="text-text-muted" />
                {cliente.cnpj}
              </div>
            )}
            {!cliente.contato && !cliente.email && !cliente.telefone && !cliente.cnpj && (
              <p className="text-sm text-text-muted">Nenhum contato cadastrado</p>
            )}
          </div>
        </div>

        {/* Platform */}
        <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Plataforma</h3>
          <div className="space-y-2">
            {cliente.plataforma && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Globe size={14} className="text-text-muted" />
                {cliente.plataforma}
              </div>
            )}
            {cliente.urlLoja && (
              <a
                href={cliente.urlLoja}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-accent hover:underline truncate"
              >
                {cliente.urlLoja}
              </a>
            )}
            {cliente.gestor && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <User size={14} className="text-text-muted" />
                Gestor: {cliente.gestor.name}
              </div>
            )}
            {!cliente.plataforma && !cliente.urlLoja && (
              <p className="text-sm text-text-muted">Nenhuma plataforma configurada</p>
            )}
          </div>
        </div>

        {/* Financial */}
        <div className="rounded-xl border border-border bg-bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">Financeiro</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Fee Mensal</span>
              <span className="text-text-primary font-medium">
                {cliente.feeMensal != null ? formatCurrency(cliente.feeMensal) : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Modelo</span>
              <span className="text-text-secondary">{cliente.modeloCobranca}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Receita Total</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(totalReceita)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Pendente</span>
              <span className={totalPendente > 0 ? "text-amber-400 font-medium" : "text-text-secondary"}>
                {formatCurrency(totalPendente)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("campanhas")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "campanhas"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          Campanhas
          <span className="ml-2 rounded-full bg-bg-secondary px-2 py-0.5 text-xs">
            {cliente.campanhas.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("financeiro")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            activeTab === "financeiro"
              ? "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          Financeiro
          <span className="ml-2 rounded-full bg-bg-secondary px-2 py-0.5 text-xs">
            {cliente.contasReceber.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "campanhas" && (
        <>
          {cliente.campanhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-12">
              <p className="text-text-muted text-sm">Nenhuma campanha registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Plataforma</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Mês</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Budget</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Gasto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Impressões</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Cliques</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">CTR</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">ROAS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.campanhas.map((camp) => {
                    const ctr = calcCTR(camp.cliques, camp.impressoes)
                    const roas = calcROAS(camp.receita, camp.gastoReal)
                    return (
                      <tr key={camp.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text-primary">{camp.nome}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{camp.plataforma}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{camp.mes}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatCurrency(camp.budgetPlanejado)}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatCurrency(camp.gastoReal)}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatNumber(camp.impressoes)}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatNumber(camp.cliques)}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary text-right">{ctr.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-sm font-medium ${
                              roas >= 3
                                ? "text-emerald-400"
                                : roas >= 2
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {roas.toFixed(2)}x
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(camp.status)}>{camp.status}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "financeiro" && (
        <>
          {cliente.contasReceber.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-12">
              <p className="text-text-muted text-sm">Nenhuma conta a receber registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Mês</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.contasReceber.map((cr) => (
                    <tr key={cr.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">{cr.descricao || "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{cr.mes}</td>
                      <td className="px-4 py-3 text-sm text-text-primary font-medium text-right">
                        {formatCurrency(cr.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(cr.status)}>{cr.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {cr.dataPagamento
                          ? new Date(cr.dataPagamento).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Total Gasto em Ads</p>
              <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(totalGasto)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Total Receita</p>
              <p className="text-lg font-semibold text-emerald-400 mt-1">{formatCurrency(totalReceita)}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">A Receber (Pendente)</p>
              <p className={`text-lg font-semibold mt-1 ${totalPendente > 0 ? "text-amber-400" : "text-text-primary"}`}>
                {formatCurrency(totalPendente)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
