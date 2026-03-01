/**
 * Register Shopify webhooks for Space Sports store.
 * Usage: node scripts/register-webhooks.mjs
 */

import { createDecipheriv, randomBytes } from 'crypto'
import { config } from 'dotenv'
import pg from 'pg'

config()

const STORE_ID = 'cmm54nwiv000004lbfyiacicl'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://recupera-ai-five.vercel.app'
const WEBHOOK_URL = `${APP_URL}/api/webhooks/shopify`

const TOPICS = [
  'checkouts/create',
  'checkouts/update',
  'orders/create',
  'orders/paid',
]

function decrypt(encryptedText) {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY not set')
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  // Get store data
  const { rows } = await client.query(
    'SELECT id, name, shopify_domain, access_token, webhook_secret FROM stores WHERE id = $1',
    [STORE_ID]
  )

  if (rows.length === 0) {
    console.error('Store not found!')
    process.exit(1)
  }

  const store = rows[0]
  console.log(`\nStore: ${store.name}`)
  console.log(`Domain: ${store.shopify_domain}`)
  console.log(`Webhook URL: ${WEBHOOK_URL}`)
  console.log(`Has webhook secret: ${Boolean(store.webhook_secret)}\n`)

  const accessToken = decrypt(store.access_token)

  // First, list existing webhooks
  console.log('--- Webhooks existentes ---')
  const listRes = await fetch(
    `https://${store.shopify_domain}/admin/api/2024-01/webhooks.json`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken },
    }
  )
  const listData = await listRes.json()
  const existing = listData.webhooks ?? []

  for (const wh of existing) {
    console.log(`  [${wh.id}] ${wh.topic} → ${wh.address}`)
  }
  console.log(`  Total: ${existing.length}\n`)

  // Delete existing webhooks that point to our URL (to re-register fresh)
  const ours = existing.filter(wh => wh.address.includes('recupera-ai'))
  if (ours.length > 0) {
    console.log(`--- Removendo ${ours.length} webhooks antigos ---`)
    for (const wh of ours) {
      const delRes = await fetch(
        `https://${store.shopify_domain}/admin/api/2024-01/webhooks/${wh.id}.json`,
        {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': accessToken },
        }
      )
      console.log(`  Deleted [${wh.id}] ${wh.topic}: ${delRes.status}`)
    }
    console.log()
  }

  // Register new webhooks
  console.log('--- Registrando webhooks novos ---')
  const webhookIds = []
  const webhookSecret = store.webhook_secret || randomBytes(32).toString('hex')

  for (const topic of TOPICS) {
    const res = await fetch(
      `https://${store.shopify_domain}/admin/api/2024-01/webhooks.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: WEBHOOK_URL,
            format: 'json',
          },
        }),
      }
    )

    if (!res.ok) {
      const errBody = await res.text()
      console.log(`  ERRO ${topic}: ${res.status} — ${errBody}`)
      continue
    }

    const data = await res.json()
    const id = data.webhook?.id
    webhookIds.push(id)
    console.log(`  OK [${id}] ${topic}`)
  }

  // Update store with webhook secret if it didn't have one
  if (!store.webhook_secret) {
    await client.query(
      'UPDATE stores SET webhook_secret = $1 WHERE id = $2',
      [webhookSecret, STORE_ID]
    )
    console.log(`\nWebhook secret salvo no banco.`)
  }

  // Save webhook IDs
  if (webhookIds.length > 0) {
    await client.query(
      'UPDATE stores SET shopify_webhook_id = $1 WHERE id = $2',
      [webhookIds.join(','), STORE_ID]
    )
  }

  console.log(`\nResultado: ${webhookIds.length}/${TOPICS.length} webhooks registrados`)

  // Verify
  console.log('\n--- Verificação final ---')
  const verifyRes = await fetch(
    `https://${store.shopify_domain}/admin/api/2024-01/webhooks.json`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken },
    }
  )
  const verifyData = await verifyRes.json()
  for (const wh of verifyData.webhooks ?? []) {
    console.log(`  [${wh.id}] ${wh.topic} → ${wh.address}`)
  }

  await client.end()
  console.log('\nDone!')
}

main().catch(console.error)
