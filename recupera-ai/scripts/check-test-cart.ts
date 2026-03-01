import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CART_ID = 'cmm7ub70t000080vhskof9g73'

async function main() {
  const cart = await prisma.abandonedCart.findUnique({
    where: { id: CART_ID },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { sentAt: 'asc' } },
        },
      },
    },
  })

  if (!cart) {
    console.log('Cart not found')
    await pool.end()
    return
  }

  console.log('=== CART STATUS ===')
  console.log({
    id: cart.id,
    status: cart.status,
    recoveryAttempts: cart.recoveryAttempts,
    lastAttemptAt: cart.lastAttemptAt,
    abandonedAt: cart.abandonedAt,
  })

  if (cart.conversation) {
    console.log('\n=== CONVERSATION ===')
    console.log({
      id: cart.conversation.id,
      status: cart.conversation.status,
      messageCount: cart.conversation.messages.length,
    })

    console.log('\n=== MESSAGES ===')
    for (const msg of cart.conversation.messages) {
      console.log(`\n[${msg.role}] (${msg.sentAt?.toISOString()})`)
      console.log(`Intent: ${msg.intent || 'N/A'} | Stage: ${msg.recoveryStage ?? 'N/A'}`)
      console.log(`Text: ${msg.content?.substring(0, 200)}${(msg.content?.length ?? 0) > 200 ? '...' : ''}`)
    }
  } else {
    console.log('\nNo conversation linked to this cart')
  }

  await pool.end()
}

main().catch(console.error)
