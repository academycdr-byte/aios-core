import crypto from 'crypto'

const SHOPIFY_API_VERSION = '2025-01'
const SHOPIFY_SCOPES = 'read_checkouts,read_orders,read_customers,read_products'

/**
 * Build the Shopify OAuth authorization URL.
 * The user is redirected here to grant access.
 */
export function getShopifyAuthUrl(
  shop: string,
  redirectUri: string,
  state: string,
  clientId: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  })
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Exchange the authorization code for a permanent access token.
 */
export async function exchangeShopifyCode(
  shop: string,
  code: string,
  credentials: { clientId: string; clientSecret: string },
): Promise<{ access_token: string; scope: string }> {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code,
  })

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return { access_token: data.access_token, scope: data.scope }
}

/**
 * Validate Shopify HMAC signature on OAuth callback.
 */
export function validateShopifyHmac(
  query: Record<string, string>,
  clientSecret: string,
): boolean {
  const { hmac, ...rest } = query
  if (!hmac) return false

  const sorted = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&')

  const digest = crypto
    .createHmac('sha256', clientSecret)
    .update(sorted)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(hmac, 'hex'),
  )
}

/**
 * Register webhooks for abandoned checkouts and order payments on a Shopify store.
 * Topics: checkouts/create, orders/paid
 */
export async function registerAbandonedCartWebhook(
  shop: string,
  accessToken: string,
  webhookUrl: string,
): Promise<{ id: string } | null> {
  const topics = ['checkouts/create', 'orders/paid']
  const ids: string[] = []

  for (const topic of topics) {
    try {
      const response = await fetch(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: webhookUrl,
              format: 'json',
            },
          }),
        },
      )

      if (!response.ok) {
        const text = await response.text()
        console.error(`[Shopify] Failed to register webhook ${topic}: ${text}`)
        continue
      }

      const data = await response.json()
      ids.push(String(data.webhook.id))
    } catch (error) {
      console.error(`[Shopify] Error registering webhook ${topic}:`, error)
    }
  }

  if (ids.length === 0) return null
  return { id: ids.join(',') }
}

/**
 * Validate a Shopify webhook request signature.
 */
export function validateWebhookSignature(
  body: string,
  hmacHeader: string,
  secret: string,
): boolean {
  const digest = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader),
  )
}

/**
 * Fetch all abandoned checkouts from Shopify REST API with pagination.
 * Returns only checkouts where completed_at is null (abandoned).
 */
export async function fetchAbandonedCheckouts(
  shop: string,
  accessToken: string,
): Promise<Record<string, unknown>[]> {
  const allCheckouts: Record<string, unknown>[] = []
  let url: string | null =
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/checkouts.json?limit=250`

  while (url) {
    const response: Response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Shopify API error (${response.status}): ${text}`)
    }

    const data = await response.json()
    const checkouts = (data.checkouts ?? []) as Record<string, unknown>[]

    const abandoned = checkouts.filter((c) => !c.completed_at)
    allCheckouts.push(...abandoned)

    // Parse Link header for next page
    const linkHeader = response.headers.get('link')
    url = null
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
      if (match) url = match[1]
    }
  }

  return allCheckouts
}

/**
 * Normalize a Shopify domain (ensure it ends with .myshopify.com).
 */
export function normalizeShopDomain(input: string): string {
  let domain = input.trim().toLowerCase()
  domain = domain.replace(/^https?:\/\//, '')
  domain = domain.replace(/\/.*$/, '')
  if (!domain.includes('.myshopify.com')) {
    domain = `${domain}.myshopify.com`
  }
  return domain
}
