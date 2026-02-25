/**
 * Mock data for RecuperaAI Dashboard
 *
 * Generates realistic, consistent data:
 * - 30 days of daily metrics
 * - 20 recent abandoned carts
 * - Aggregated totals
 *
 * Constraints enforced:
 * - recoveredCount <= contactedCount <= abandonedCount
 * - paidCount <= recoveredCount
 * - recoveredValue <= abandonedValue
 * - paidValue <= recoveredValue
 * - recoveryRate = recoveredCount / abandonedCount
 */

import type { CartStatus, CartType } from '@/generated/prisma/enums'

// ============================================================
// Types
// ============================================================

export interface DailyMetric {
  date: string // ISO date string
  dateLabel: string // "24/02" format
  abandonedCount: number
  abandonedValue: number
  contactedCount: number
  recoveredCount: number
  recoveredValue: number
  paidCount: number
  paidValue: number
  recoveryRate: number
  totalConversations: number
}

export interface RecentCart {
  id: string
  customerName: string
  customerPhone: string
  cartTotal: number
  cartItems: CartItem[]
  itemCount: number
  type: CartType
  status: CartStatus
  abandonedAt: Date
  recoveryAttempts: number
}

export interface CartItem {
  name: string
  quantity: number
  price: number
  image?: string
}

export interface DashboardTotals {
  abandonedValue: number
  recoveredValue: number
  recoveryRate: number
  paidOrders: number
  avgTicketRecovered: number
  activeConversations: number
  abandonedCount: number
  recoveredCount: number
  paidCount: number
  paidValue: number
}

export interface TypeDistribution {
  name: string
  value: number
  count: number
  color: string
}

// ============================================================
// Seed for reproducibility
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

function randBetween(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
  return min + rand() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// ============================================================
// Brazilian names and products
// ============================================================

const firstNames = [
  'Ana Paula', 'Carlos', 'Fernanda', 'Lucas', 'Mariana',
  'Rafael', 'Juliana', 'Pedro', 'Camila', 'Thiago',
  'Larissa', 'Gustavo', 'Beatriz', 'Bruno', 'Amanda',
  'Diego', 'Priscila', 'Rodrigo', 'Natalia', 'Felipe',
  'Tatiana', 'Marcelo', 'Leticia', 'Andre', 'Vanessa',
]

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima',
  'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida',
  'Nascimento', 'Araujo', 'Melo', 'Barbosa', 'Ribeiro',
  'Martins', 'Carvalho', 'Gomes', 'Rocha', 'Vieira',
]

const products: CartItem[] = [
  { name: 'Camiseta Oversized Preta', quantity: 1, price: 89.90 },
  { name: 'Calca Jogger Cargo', quantity: 1, price: 159.90 },
  { name: 'Tenis Nike Air Max', quantity: 1, price: 599.90 },
  { name: 'Moletom Canguru Cinza', quantity: 1, price: 189.90 },
  { name: 'Bermuda Sarja Bege', quantity: 1, price: 119.90 },
  { name: 'Jaqueta Corta-Vento', quantity: 1, price: 249.90 },
  { name: 'Bone Trucker Preto', quantity: 1, price: 69.90 },
  { name: 'Meia Cano Alto (3 pares)', quantity: 1, price: 49.90 },
  { name: 'Cinto Couro Marrom', quantity: 1, price: 79.90 },
  { name: 'Tenis Adidas Ultraboost', quantity: 1, price: 899.90 },
  { name: 'Vestido Midi Floral', quantity: 1, price: 179.90 },
  { name: 'Blusa Cropped Branca', quantity: 1, price: 59.90 },
  { name: 'Saia Jeans Midi', quantity: 1, price: 129.90 },
  { name: 'Sandalia Rasteira Dourada', quantity: 1, price: 99.90 },
  { name: 'Bolsa Tote Couro', quantity: 1, price: 349.90 },
  { name: 'Oculos de Sol Aviador', quantity: 1, price: 199.90 },
  { name: 'Relogio Digital Preto', quantity: 1, price: 259.90 },
  { name: 'Chinelo Slide', quantity: 1, price: 79.90 },
  { name: 'Camiseta Polo Branca', quantity: 1, price: 109.90 },
  { name: 'Short Fitness Feminino', quantity: 1, price: 89.90 },
]

// ============================================================
// Generate daily metrics (30 days)
// ============================================================

function generateDailyMetrics(): DailyMetric[] {
  const metrics: DailyMetric[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    // Weekdays have more traffic
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const trafficMultiplier = isWeekend ? 0.6 : 1.0

    // Slight upward trend over the month
    const trendMultiplier = 1 + (29 - i) * 0.008

    const abandonedCount = Math.round(randBetween(8, 18) * trafficMultiplier * trendMultiplier)
    const avgCartValue = randFloat(120, 380)
    const abandonedValue = Math.round(abandonedCount * avgCartValue * 100) / 100

    // 60-80% are contacted
    const contactedCount = Math.min(abandonedCount, Math.round(abandonedCount * randFloat(0.6, 0.8)))

    // 15-25% recovery rate (of abandoned, not contacted)
    const rawRecoveryRate = randFloat(0.15, 0.25) * trendMultiplier
    const recoveryRate = Math.min(rawRecoveryRate, 0.35)
    const recoveredCount = Math.min(contactedCount, Math.max(1, Math.round(abandonedCount * recoveryRate)))
    const recoveredValue = Math.round(recoveredCount * avgCartValue * randFloat(0.85, 1.05) * 100) / 100

    // 70-90% of recovered actually pay
    const paidCount = Math.min(recoveredCount, Math.max(1, Math.round(recoveredCount * randFloat(0.7, 0.9))))
    const paidValue = Math.round(paidCount * avgCartValue * randFloat(0.9, 1.0) * 100) / 100

    const totalConversations = contactedCount + randBetween(0, 3)

    const dateStr = date.toISOString().split('T')[0]
    const dateLabel = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`

    metrics.push({
      date: dateStr,
      dateLabel,
      abandonedCount,
      abandonedValue: Math.round(abandonedValue),
      contactedCount,
      recoveredCount,
      recoveredValue: Math.round(recoveredValue),
      paidCount,
      paidValue: Math.round(paidValue),
      recoveryRate: Math.round((recoveredCount / abandonedCount) * 100 * 10) / 10,
      totalConversations,
    })
  }

  return metrics
}

// ============================================================
// Generate recent carts (20)
// ============================================================

function generateRecentCarts(): RecentCart[] {
  const carts: RecentCart[] = []
  const now = new Date()

  const statusWeights: Array<{ status: CartStatus; weight: number }> = [
    { status: 'PENDING', weight: 30 },
    { status: 'CONTACTING', weight: 25 },
    { status: 'RECOVERED', weight: 15 },
    { status: 'PAID', weight: 10 },
    { status: 'LOST', weight: 15 },
    { status: 'EXPIRED', weight: 5 },
  ]

  function pickWeightedStatus(): CartStatus {
    const totalWeight = statusWeights.reduce((sum, s) => sum + s.weight, 0)
    let r = rand() * totalWeight
    for (const s of statusWeights) {
      r -= s.weight
      if (r <= 0) return s.status
    }
    return 'PENDING'
  }

  for (let i = 0; i < 20; i++) {
    const firstName = pick(firstNames)
    const lastName = pick(lastNames)

    // Random abandoned time: 5 min to 72 hours ago
    const minutesAgo = randBetween(5, 4320)
    const abandonedAt = new Date(now.getTime() - minutesAgo * 60 * 1000)

    // Pick 1-4 products
    const itemCount = randBetween(1, 4)
    const cartItems: CartItem[] = []
    const usedIndices = new Set<number>()
    for (let j = 0; j < itemCount; j++) {
      let idx: number
      do {
        idx = Math.floor(rand() * products.length)
      } while (usedIndices.has(idx))
      usedIndices.add(idx)
      const product = products[idx]
      cartItems.push({
        ...product,
        quantity: randBetween(1, 2),
      })
    }

    const cartTotal = Math.round(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100

    // Type distribution: 70% abandoned, 20% PIX, 10% card
    const typeRoll = rand()
    let type: CartType
    if (typeRoll < 0.7) {
      type = 'ABANDONED_CART'
    } else if (typeRoll < 0.9) {
      type = 'PIX_PENDING'
    } else {
      type = 'CARD_DECLINED'
    }

    const status = pickWeightedStatus()
    const recoveryAttempts = status === 'PENDING' ? 0 : randBetween(1, 3)

    const ddd = pick(['11', '21', '31', '41', '51', '61', '71', '81', '85', '27'])
    const phone = `+55${ddd}9${randBetween(1000, 9999)}${randBetween(1000, 9999)}`

    carts.push({
      id: `cart_${String(i + 1).padStart(3, '0')}`,
      customerName: `${firstName} ${lastName}`,
      customerPhone: phone,
      cartTotal,
      cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      type,
      status,
      abandonedAt,
      recoveryAttempts,
    })
  }

  // Sort by most recent first
  carts.sort((a, b) => b.abandonedAt.getTime() - a.abandonedAt.getTime())

  return carts
}

// ============================================================
// Compute totals from daily metrics
// ============================================================

function computeTotals(metrics: DailyMetric[], carts: RecentCart[]): DashboardTotals {
  const abandonedValue = metrics.reduce((sum, m) => sum + m.abandonedValue, 0)
  const recoveredValue = metrics.reduce((sum, m) => sum + m.recoveredValue, 0)
  const abandonedCount = metrics.reduce((sum, m) => sum + m.abandonedCount, 0)
  const recoveredCount = metrics.reduce((sum, m) => sum + m.recoveredCount, 0)
  const paidCount = metrics.reduce((sum, m) => sum + m.paidCount, 0)
  const paidValue = metrics.reduce((sum, m) => sum + m.paidValue, 0)

  const recoveryRate = abandonedCount > 0
    ? Math.round((recoveredCount / abandonedCount) * 100 * 10) / 10
    : 0

  const avgTicketRecovered = paidCount > 0
    ? Math.round(paidValue / paidCount)
    : 0

  const activeConversations = carts.filter(
    (c) => c.status === 'PENDING' || c.status === 'CONTACTING'
  ).length

  return {
    abandonedValue,
    recoveredValue,
    recoveryRate,
    paidOrders: paidCount,
    avgTicketRecovered,
    activeConversations,
    abandonedCount,
    recoveredCount,
    paidCount,
    paidValue,
  }
}

// ============================================================
// Compute type distribution
// ============================================================

function computeTypeDistribution(metrics: DailyMetric[]): TypeDistribution[] {
  // Based on the 70/20/10 split, distribute total abandoned count
  const totalAbandoned = metrics.reduce((sum, m) => sum + m.abandonedCount, 0)

  const abandonedCart = Math.round(totalAbandoned * 0.70)
  const pixPending = Math.round(totalAbandoned * 0.20)
  const cardDeclined = totalAbandoned - abandonedCart - pixPending

  return [
    {
      name: 'Carrinho Abandonado',
      value: abandonedCart,
      count: abandonedCart,
      color: '#F59E0B', // warning/yellow
    },
    {
      name: 'PIX Pendente',
      value: pixPending,
      count: pixPending,
      color: '#3B82F6', // info/blue
    },
    {
      name: 'Cartao Recusado',
      value: cardDeclined,
      count: cardDeclined,
      color: '#EF4444', // error/red
    },
  ]
}

// ============================================================
// Export pre-generated data
// ============================================================

export const dailyMetrics: DailyMetric[] = generateDailyMetrics()
export const recentCarts: RecentCart[] = generateRecentCarts()
export const dashboardTotals: DashboardTotals = computeTotals(dailyMetrics, recentCarts)
export const typeDistribution: TypeDistribution[] = computeTypeDistribution(dailyMetrics)

// Trend data: compare last 7 days vs previous 7 days
function computeTrend(metricKey: keyof DailyMetric): { value: number; isPositive: boolean } {
  const last7 = dailyMetrics.slice(-7)
  const prev7 = dailyMetrics.slice(-14, -7)

  const sumLast = last7.reduce((sum, m) => sum + (m[metricKey] as number), 0)
  const sumPrev = prev7.reduce((sum, m) => sum + (m[metricKey] as number), 0)

  if (sumPrev === 0) return { value: 0, isPositive: true }

  const change = ((sumLast - sumPrev) / sumPrev) * 100
  return {
    value: Math.round(Math.abs(change) * 10) / 10,
    isPositive: metricKey === 'abandonedValue' ? change <= 0 : change >= 0,
  }
}

export const trends = {
  abandonedValue: computeTrend('abandonedValue'),
  recoveredValue: computeTrend('recoveredValue'),
  recoveryRate: computeTrend('recoveryRate'),
  paidCount: computeTrend('paidCount'),
  paidValue: computeTrend('paidValue'),
  totalConversations: computeTrend('totalConversations'),
}

// ============================================================
// Abandonment reasons mock data
// ============================================================

export interface AbandonmentReasonData {
  reason: string
  label: string
  count: number
  color: string
}

export const abandonmentReasons: AbandonmentReasonData[] = [
  { reason: 'PRICE', label: 'Preco alto', count: 42, color: '#F59E0B' },
  { reason: 'SHIPPING', label: 'Frete caro/demorado', count: 28, color: '#3B82F6' },
  { reason: 'CHANGED_MIND', label: 'Desistiu da compra', count: 19, color: '#8B5CF6' },
  { reason: 'PRODUCT_DOUBT', label: 'Duvida sobre produto', count: 14, color: '#06B6D4' },
  { reason: 'PAYMENT_ISSUE', label: 'Problema no pagamento', count: 11, color: '#EF4444' },
  { reason: 'NO_RESPONSE', label: 'Sem resposta', count: 35, color: '#6B7280' },
  { reason: 'OTHER', label: 'Outros', count: 8, color: '#A3A3A3' },
]
