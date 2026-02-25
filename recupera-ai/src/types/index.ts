/**
 * RecuperaAI - Type Definitions
 * All interfaces and enums for the application
 */

// ============================================================
// ENUMS
// ============================================================

export const Platform = {
  SHOPIFY: 'SHOPIFY',
  NUVEMSHOP: 'NUVEMSHOP',
} as const
export type Platform = (typeof Platform)[keyof typeof Platform]

export const CartType = {
  ABANDONED_CART: 'ABANDONED_CART',
  PIX_PENDING: 'PIX_PENDING',
  CARD_DECLINED: 'CARD_DECLINED',
} as const
export type CartType = (typeof CartType)[keyof typeof CartType]

export const CartStatus = {
  PENDING: 'PENDING',
  CONTACTING: 'CONTACTING',
  RECOVERED: 'RECOVERED',
  PAID: 'PAID',
  LOST: 'LOST',
  EXPIRED: 'EXPIRED',
} as const
export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus]

export const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  RECOVERED: 'RECOVERED',
  LOST: 'LOST',
  ESCALATED: 'ESCALATED',
  EXPIRED: 'EXPIRED',
} as const
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus]

export const MessageRole = {
  AI: 'AI',
  CUSTOMER: 'CUSTOMER',
  SYSTEM: 'SYSTEM',
} as const
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole]

export const MessageStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus]

export const AbandonmentReason = {
  PRICE: 'PRICE',
  SHIPPING: 'SHIPPING',
  PRODUCT_DOUBT: 'PRODUCT_DOUBT',
  FOUND_ELSEWHERE: 'FOUND_ELSEWHERE',
  CHANGED_MIND: 'CHANGED_MIND',
  PAYMENT_ISSUE: 'PAYMENT_ISSUE',
  NO_RESPONSE: 'NO_RESPONSE',
  OTHER: 'OTHER',
} as const
export type AbandonmentReason = (typeof AbandonmentReason)[keyof typeof AbandonmentReason]

// ============================================================
// STORE
// ============================================================

export interface Store {
  id: string
  userId: string
  name: string
  platform: Platform
  domain: string | null
  accessToken: string | null
  shopifyDomain: string | null
  shopifyWebhookId: string | null
  nuvemshopStoreId: string | null
  whatsappPhone: string | null
  whatsappConnected: boolean
  isActive: boolean
  webhookSecret: string | null
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StoreSettings {
  id: string
  storeId: string
  storeName: string | null
  storeDescription: string | null
  mainProducts: string | null
  targetAudience: string | null
  shippingPolicy: string | null
  returnPolicy: string | null
  paymentMethods: string | null
  warrantyPolicy: string | null
  faqContent: string | null
  currentOffers: string | null
  canOfferDiscount: boolean
  maxDiscountPercent: number | null
  couponCode: string | null
  couponDiscount: number | null
  aiTone: string
  aiName: string
  customInstructions: string | null
  businessHoursStart: string | null
  businessHoursEnd: string | null
  sendOutsideHours: boolean
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface RecoveryConfig {
  id: string
  storeId: string
  isActive: boolean
  firstMessageDelay: number
  followUp1Delay: number
  followUp2Delay: number
  followUp3Delay: number | null
  maxAttempts: number
  firstMessageTemplate: string | null
  followUp1Template: string | null
  followUp2Template: string | null
  followUp3Template: string | null
  minCartValue: number
  excludeReturning: boolean
  pixRecoveryEnabled: boolean
  pixFirstDelay: number
  pixFollowUpDelay: number
  pixMaxAttempts: number
  cardRecoveryEnabled: boolean
  cardFirstDelay: number
  cardMaxAttempts: number
  createdAt: string
  updatedAt: string
}

// ============================================================
// ABANDONED CART
// ============================================================

export interface CartItem {
  id: string
  name: string
  variant: string | null
  quantity: number
  price: number
  imageUrl: string | null
}

export interface AbandonedCart {
  id: string
  storeId: string
  storeName?: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  cartTotal: number
  currency: string
  cartItems: CartItem[]
  itemCount: number
  checkoutUrl: string | null
  platformCartId: string | null
  platformOrderId: string | null
  type: CartType
  status: CartStatus
  recoveryAttempts: number
  lastAttemptAt: string | null
  recoveredAt: string | null
  recoveredValue: number | null
  paidAt: string | null
  paidValue: number | null
  abandonedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  conversationId?: string | null
}

// ============================================================
// CONVERSATION & MESSAGE
// ============================================================

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  intent: string | null
  whatsappMsgId: string | null
  messageStatus: MessageStatus
  tokensUsed: number | null
  modelUsed: string | null
  sentAt: string
  deliveredAt: string | null
  readAt: string | null
}

export interface Conversation {
  id: string
  storeId: string
  storeName?: string
  abandonedCartId: string | null
  customerPhone: string
  customerName: string | null
  status: ConversationStatus
  aiModel: string | null
  totalTokens: number
  estimatedCost: number
  abandonmentReason: AbandonmentReason | null
  closingReason: string | null
  startedAt: string
  lastMessageAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  messages?: Message[]
  cart?: AbandonedCart | null
  lastMessage?: string | null
  cartTotal?: number
}

// ============================================================
// METRICS & DASHBOARD
// ============================================================

export interface DailyMetrics {
  id: string
  storeId: string
  date: string
  abandonedCount: number
  abandonedValue: number
  contactedCount: number
  recoveredCount: number
  recoveredValue: number
  paidCount: number
  paidValue: number
  avgTicket: number
  recoveryRate: number
  totalConversations: number
  avgMessagesPerConv: number
  aiCost: number
  createdAt: string
}

export interface DashboardData {
  totalAbandoned: number
  totalAbandonedValue: number
  totalContacted: number
  totalRecovered: number
  totalRecoveredValue: number
  totalPaid: number
  totalPaidValue: number
  recoveryRate: number
  avgTicket: number
  totalConversations: number
  avgMessagesPerConv: number
  totalAiCost: number
  dailyMetrics: DailyMetrics[]
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
