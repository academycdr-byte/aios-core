import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const clienteSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cnpj: z.string().optional().nullable(),
  segmento: z.string().optional().nullable(),
  contato: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  telefone: z.string().optional().nullable(),
  plataforma: z.enum(["SHOPIFY", "WOOCOMMERCE", "VTEX", "NUVEMSHOP", "OUTRA"]).optional().nullable(),
  urlLoja: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  status: z.enum(["ATIVO", "PAUSADO", "CHURN"]).default("ATIVO"),
  feeMensal: z.number().min(0).optional().nullable(),
  modeloCobranca: z.enum(["FIXO", "PERCENTUAL", "HIBRIDO"]).default("FIXO"),
  gestorId: z.string().optional().nullable(),
})

export const campanhaSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  clienteId: z.string().min(1, "Cliente é obrigatório"),
  plataforma: z.enum(["META_ADS", "GOOGLE_ADS", "TIKTOK_ADS"]),
  budgetPlanejado: z.number().min(0, "Budget deve ser positivo"),
  gastoReal: z.number().min(0).default(0),
  impressoes: z.number().int().min(0).default(0),
  cliques: z.number().int().min(0).default(0),
  conversoes: z.number().int().min(0).default(0),
  receita: z.number().min(0).default(0),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser AAAA-MM"),
  status: z.enum(["ATIVA", "PAUSADA", "FINALIZADA"]).default("ATIVA"),
})

export const contaReceberSchema = z.object({
  clienteId: z.string().min(1, "Cliente é obrigatório"),
  descricao: z.string().optional().nullable(),
  valor: z.number().min(0, "Valor deve ser positivo"),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser AAAA-MM"),
  status: z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]).default("PENDENTE"),
  dataPagamento: z.string().datetime().optional().nullable(),
})

export const membroEquipeSchema = z.object({
  userId: z.string().min(1, "Usuário é obrigatório"),
  cargo: z.enum(["GESTOR_CONTA", "ANALISTA_MIDIA", "DESIGNER", "COPYWRITER"]),
})

export const tarefaSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório"),
  descricao: z.string().optional().nullable(),
  status: z.enum(["A_FAZER", "FAZENDO", "FEITO"]).default("A_FAZER"),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  clienteId: z.string().optional().nullable(),
  responsavelId: z.string().optional().nullable(),
  prazo: z.string().datetime().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ClienteInput = z.infer<typeof clienteSchema>
export type CampanhaInput = z.infer<typeof campanhaSchema>
export type ContaReceberInput = z.infer<typeof contaReceberSchema>
export type MembroEquipeInput = z.infer<typeof membroEquipeSchema>
export type TarefaInput = z.infer<typeof tarefaSchema>
