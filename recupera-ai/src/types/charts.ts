/**
 * Chart data types used by dashboard components
 */

export interface DailyMetric {
  date: string
  dateLabel: string
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

export interface TypeDistribution {
  name: string
  value: number
  count: number
  color: string
}

export interface AbandonmentReasonData {
  reason: string
  label: string
  count: number
  color: string
}

export interface RecentCart {
  id: string
  customerName: string
  customerPhone: string
  cartTotal: number
  cartItems: { name: string; quantity: number; price: number; image?: string }[]
  itemCount: number
  type: 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED'
  status: 'PENDING' | 'CONTACTING' | 'RECOVERED' | 'PAID' | 'LOST' | 'EXPIRED'
  abandonedAt: Date
  recoveryAttempts: number
}

export interface StepMetric {
  stepNumber: number
  stepLabel: string
  messagesSent: number
  messagesDelivered: number
  messagesRead: number
  linkClicks: number
  messagesReplied: number
  conversions: number
  conversionValue: number
  openRate: number
  clickRate: number
  responseRate: number
  conversionRate: number
  costPerConversion: number
}
