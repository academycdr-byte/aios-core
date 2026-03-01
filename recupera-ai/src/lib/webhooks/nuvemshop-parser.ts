/**
 * Nuvemshop (Tiendanube) Webhook Payload Parser
 * Extracts structured data from Nuvemshop webhook payloads for AbandonedCart creation.
 */

// ============================================================
// TYPES
// ============================================================

export interface NuvemshopAbandonedCartPayload {
  id?: number | string
  token?: string
  store_id?: number | string
  event?: string
  total?: number | string
  subtotal?: number | string
  currency?: string
  checkout_url?: string
  recovery_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_identification?: string
  customer?: {
    id?: number
    name?: string
    email?: string
    phone?: string
    identification?: string
  }
  products?: NuvemshopProduct[]
  created_at?: string
  updated_at?: string
  completed_at?: string
}

export interface NuvemshopProduct {
  product_id?: number | string
  variant_id?: number | string
  name?: string
  quantity?: number
  price?: number | string
  variant_values?: string[]
  image?: {
    src?: string
  }
}

export interface NuvemshopOrderPayload {
  id?: number | string
  number?: number | string
  store_id?: number | string
  event?: string
  total?: number | string
  currency?: string
  payment_status?: string
  checkout_id?: number | string
  customer?: {
    id?: number
    name?: string
    email?: string
    phone?: string
  }
  products?: NuvemshopProduct[]
  created_at?: string
}

export interface ParsedAbandonedCart {
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
 * Parse Nuvemshop abandoned cart webhook payload into structured data.
 */
export function parseAbandonedCart(
  payload: NuvemshopAbandonedCartPayload
): ParsedAbandonedCart {
  // Extract customer info from either top-level contact or customer object
  const customerName =
    payload.customer?.name ??
    payload.contact_name ??
    null

  const customerEmail =
    payload.customer?.email ??
    payload.contact_email ??
    null

  const customerPhone =
    payload.customer?.phone ??
    payload.contact_phone ??
    null

  // Parse total (can be string or number)
  const cartTotal = typeof payload.total === 'string'
    ? parseFloat(payload.total)
    : (payload.total ?? 0)

  // Parse products
  const cartItems: CartItemData[] = (payload.products ?? []).map((product) => ({
    id: (product.product_id ?? product.variant_id ?? '').toString(),
    name: product.name ?? 'Produto',
    variant: product.variant_values
      ? product.variant_values.join(' / ')
      : null,
    quantity: product.quantity ?? 1,
    price: typeof product.price === 'string'
      ? parseFloat(product.price)
      : (product.price ?? 0),
    imageUrl: product.image?.src ?? null,
  }))

  // Nuvemshop provides recovery_url or checkout_url
  const checkoutUrl = payload.recovery_url ?? payload.checkout_url ?? null

  return {
    platformCartId: (payload.id ?? payload.token ?? '').toString() || null,
    customerName,
    customerEmail,
    customerPhone,
    cartTotal,
    currency: payload.currency ?? 'BRL',
    itemCount: cartItems.length,
    cartItems,
    checkoutUrl,
    abandonedAt: payload.created_at ? new Date(payload.created_at) : new Date(),
  }
}

/**
 * Parse Nuvemshop order/paid webhook payload for updating recovered cart status.
 */
export function parseOrderPaid(
  payload: NuvemshopOrderPayload
): ParsedOrderPaid {
  const cartTotal = typeof payload.total === 'string'
    ? parseFloat(payload.total)
    : (payload.total ?? 0)

  return {
    platformOrderId: (payload.id ?? payload.number ?? '').toString(),
    platformCartId: payload.checkout_id?.toString() ?? null,
    customerEmail: payload.customer?.email ?? null,
    customerPhone: payload.customer?.phone ?? null,
    paidValue: cartTotal,
    currency: payload.currency ?? 'BRL',
  }
}
