/**
 * Shopify Webhook Payload Parser
 * Extracts structured data from Shopify webhook payloads for AbandonedCart creation.
 */

// ============================================================
// TYPES
// ============================================================

export interface ShopifyCheckoutPayload {
  id?: number | string
  token?: string
  order_id?: number | string
  email?: string
  phone?: string
  currency?: string
  total_price?: string
  subtotal_price?: string
  total_tax?: string
  total_discounts?: string
  abandoned_checkout_url?: string
  customer?: {
    id?: number
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    default_address?: {
      phone?: string
    }
  }
  shipping_address?: {
    phone?: string
    first_name?: string
    last_name?: string
    city?: string
    province?: string
    country?: string
  }
  billing_address?: {
    phone?: string
  }
  line_items?: ShopifyLineItem[]
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  closed_at?: string | null
}

export interface ShopifyLineItem {
  id?: number | string
  title?: string
  variant_title?: string
  quantity?: number
  price?: string
  sku?: string
  variant_id?: number | string
  product_id?: number | string
  image?: string | null
}

export interface ShopifyOrderPayload {
  id?: number | string
  order_number?: number
  email?: string
  phone?: string
  total_price?: string
  currency?: string
  financial_status?: string
  checkout_id?: number | string
  checkout_token?: string
  gateway?: string
  payment_gateway_names?: string[]
  customer?: {
    id?: number
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
  }
  line_items?: ShopifyLineItem[]
  created_at?: string
}

export interface ParsedAbandonedCheckout {
  platformCartId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  cartTotal: number
  currency: string
  itemCount: number
  cartItems: CartItemData[]
  checkoutUrl: string | null
  abandonedAt: Date
}

export interface ParsedOrderPaid {
  platformOrderId: string
  platformCartId: string | null
  customerEmail: string | null
  customerPhone: string | null
  paidValue: number
  currency: string
}

interface CartItemData {
  id: string
  name: string
  variant: string | null
  quantity: number
  price: number
  imageUrl: string | null
}

// ============================================================
// PARSERS
// ============================================================

/**
 * Parse Shopify abandoned checkout webhook payload into structured data for AbandonedCart creation.
 */
export function parseAbandonedCheckout(
  payload: ShopifyCheckoutPayload
): ParsedAbandonedCheckout {
  // Extract customer name from multiple sources
  const customerName = extractCustomerName(payload)

  // Extract phone from multiple sources (customer, shipping, billing)
  const customerPhone = extractCustomerPhone(payload)

  // Extract email
  const customerEmail =
    payload.email ??
    payload.customer?.email ??
    null

  // Parse line items
  const cartItems: CartItemData[] = (payload.line_items ?? []).map((item) => ({
    id: (item.product_id ?? item.id ?? '').toString(),
    name: item.title ?? 'Unknown Product',
    variant: item.variant_title || null,
    quantity: item.quantity ?? 1,
    price: parseFloat(item.price ?? '0'),
    imageUrl: item.image ?? null,
  }))

  return {
    platformCartId: payload.id?.toString() ?? payload.token ?? null,
    customerName,
    customerEmail,
    customerPhone,
    cartTotal: parseFloat(payload.total_price ?? '0'),
    currency: payload.currency ?? 'BRL',
    itemCount: cartItems.length,
    cartItems,
    checkoutUrl: payload.abandoned_checkout_url ?? null,
    abandonedAt: payload.created_at ? new Date(payload.created_at) : new Date(),
  }
}

/**
 * Parse Shopify order/paid webhook payload for updating recovered cart status.
 */
export function parseOrderPaid(
  payload: ShopifyOrderPayload
): ParsedOrderPaid {
  return {
    platformOrderId: (payload.id ?? payload.order_number ?? '').toString(),
    platformCartId: payload.checkout_id?.toString() ?? payload.checkout_token ?? null,
    customerEmail: payload.email ?? payload.customer?.email ?? null,
    customerPhone: payload.phone ?? payload.customer?.phone ?? null,
    paidValue: parseFloat(payload.total_price ?? '0'),
    currency: payload.currency ?? 'BRL',
  }
}

/**
 * Detect payment type from Shopify order payload.
 * Returns 'PIX_PENDING', 'CARD_DECLINED', 'PAID', or null (ignore).
 */
export function detectPaymentType(
  payload: ShopifyOrderPayload
): 'PIX_PENDING' | 'CARD_DECLINED' | 'PAID' | null {
  const status = payload.financial_status?.toLowerCase() ?? ''
  const gateways = (payload.payment_gateway_names ?? []).map(g => g.toLowerCase())
  const gateway = payload.gateway?.toLowerCase() ?? ''
  const allGateways = [...gateways, gateway].filter(Boolean)

  const pixKeywords = ['pix', 'mercadopago_pix', 'pagarme_pix', 'appmax_pix', 'yampi_pix']
  const isPix = allGateways.some(g => pixKeywords.some(k => g.includes(k)))

  if (status === 'paid') return 'PAID'
  if (status === 'pending' && isPix) return 'PIX_PENDING'
  if (status === 'voided' || status === 'refunded') return null // ignore
  // Card declined: pending but NOT pix, or explicitly failed
  if ((status === 'pending' || status === 'failure') && !isPix && allGateways.length > 0) {
    return 'CARD_DECLINED'
  }

  return null
}

/**
 * Parse Shopify order/create payload into data for PIX_PENDING or CARD_DECLINED cart creation.
 */
export function parseOrderCreated(payload: ShopifyOrderPayload): {
  platformOrderId: string
  platformCartId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  cartTotal: number
  currency: string
  cartItems: CartItemData[]
  itemCount: number
  checkoutUrl: string | null
} {
  const customerName = payload.customer
    ? `${payload.customer.first_name ?? ''} ${payload.customer.last_name ?? ''}`.trim() || null
    : null

  const cartItems: CartItemData[] = (payload.line_items ?? []).map((item) => ({
    id: (item.product_id ?? item.id ?? '').toString(),
    name: item.title ?? 'Unknown Product',
    variant: item.variant_title || null,
    quantity: item.quantity ?? 1,
    price: parseFloat(item.price ?? '0'),
    imageUrl: item.image ?? null,
  }))

  return {
    platformOrderId: (payload.id ?? payload.order_number ?? '').toString(),
    platformCartId: payload.checkout_id?.toString() ?? payload.checkout_token ?? null,
    customerName,
    customerEmail: payload.email ?? payload.customer?.email ?? null,
    customerPhone: payload.phone ?? payload.customer?.phone ?? null,
    cartTotal: parseFloat(payload.total_price ?? '0'),
    currency: payload.currency ?? 'BRL',
    cartItems,
    itemCount: cartItems.length,
    checkoutUrl: null,
  }
}

// ============================================================
// HELPERS
// ============================================================

function extractCustomerName(payload: ShopifyCheckoutPayload): string | null {
  // Try customer object
  if (payload.customer?.first_name || payload.customer?.last_name) {
    return `${payload.customer.first_name ?? ''} ${payload.customer.last_name ?? ''}`.trim() || null
  }

  // Try shipping address
  if (payload.shipping_address?.first_name || payload.shipping_address?.last_name) {
    return `${payload.shipping_address.first_name ?? ''} ${payload.shipping_address.last_name ?? ''}`.trim() || null
  }

  return null
}

function extractCustomerPhone(payload: ShopifyCheckoutPayload): string | null {
  // Priority: checkout phone > customer phone > customer default address > shipping > billing
  return (
    payload.phone ??
    payload.customer?.phone ??
    payload.customer?.default_address?.phone ??
    payload.shipping_address?.phone ??
    payload.billing_address?.phone ??
    null
  )
}
