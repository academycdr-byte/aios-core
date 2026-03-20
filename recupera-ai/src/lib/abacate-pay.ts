/**
 * Abacate Pay Client
 * Integração com o gateway de pagamentos para cobrança de comissão (revenue share).
 * Docs: https://docs.abacatepay.com
 */

const API_BASE = 'https://api.abacatepay.com/v2'

function getApiKey(): string {
  const key = process.env.ABACATE_PAY_API_KEY
  if (!key) throw new Error('[AbacatePay] ABACATE_PAY_API_KEY não configurada')
  return key
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error(`[AbacatePay] API error:`, { url, status: res.status, data })
    throw new Error(data.error || `AbacatePay API error: ${res.status}`)
  }

  return data.data as T
}

// ============================================================
// TYPES
// ============================================================

interface AbacateCustomer {
  id: string
  email: string
  name: string
  cellphone: string
  taxId: string
}

interface AbacateCheckout {
  id: string
  url: string
  amount: number
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED'
  devMode: boolean
  methods: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================
// CUSTOMERS
// ============================================================

export async function createCustomer(params: {
  name: string
  email: string
  cellphone: string
  taxId: string // CPF ou CNPJ
}): Promise<AbacateCustomer> {
  return request<AbacateCustomer>('/customers/create', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ============================================================
// CHECKOUTS
// ============================================================

/**
 * Cria um checkout para cobrança de comissão.
 * O lojista recebe um link para pagar via PIX ou cartão.
 */
export async function createBillingCheckout(params: {
  amount: number // Em centavos (R$ 10,00 = 1000)
  storeId: string
  invoiceId: string
  storeName: string
  periodLabel: string // Ex: "Março/2026"
  customerId?: string
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  // Abacate Pay v2 usa products + checkout
  // Para cobrança avulsa, criamos um checkout com item inline
  const checkout = await request<AbacateCheckout>('/checkouts/create', {
    method: 'POST',
    body: JSON.stringify({
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [
        {
          externalId: params.invoiceId,
          name: `Comissão RecuperaAI — ${params.periodLabel}`,
          description: `Comissão de 10% sobre valor recuperado da loja ${params.storeName}`,
          quantity: 1,
          price: params.amount, // centavos
        },
      ],
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cobranca?paid=true`,
      completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cobranca?paid=true`,
      ...(params.customerId ? { customerId: params.customerId } : {}),
      metadata: {
        storeId: params.storeId,
        invoiceId: params.invoiceId,
        type: 'recovery_commission',
      },
    }),
  })

  return {
    checkoutId: checkout.id,
    checkoutUrl: checkout.url,
  }
}

/**
 * Verifica o status de um checkout.
 */
export async function getCheckoutStatus(
  checkoutId: string
): Promise<AbacateCheckout> {
  return request<AbacateCheckout>(`/checkouts/get?id=${checkoutId}`)
}

/**
 * Valida webhook signature da Abacate Pay.
 * Usa query param webhookSecret para validação simples.
 */
export function validateWebhookSecret(receivedSecret: string): boolean {
  const expectedSecret = process.env.ABACATE_PAY_WEBHOOK_SECRET
  if (!expectedSecret) {
    console.warn('[AbacatePay] ABACATE_PAY_WEBHOOK_SECRET não configurada')
    return false
  }
  return receivedSecret === expectedSecret
}

export const abacatePay = {
  createCustomer,
  createBillingCheckout,
  getCheckoutStatus,
  validateWebhookSecret,
}
