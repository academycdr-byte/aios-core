import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CART_ID = 'cmm7ub70t000080vhskof9g73'

async function main() {
  // Simulate time passing: set lastAttemptAt to 25 hours ago
  // Follow-up step 2 has delay of 1440min (24h), so 25h ago triggers it
  const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000)

  await prisma.abandonedCart.update({
    where: { id: CART_ID },
    data: {
      lastAttemptAt: twentyFiveHoursAgo,
      abandonedAt: new Date(Date.now() - 50 * 60 * 60 * 1000), // 50h ago
    },
  })

  console.log('Cart updated: lastAttemptAt set to 25h ago to trigger follow-up step 2 (last attempt)')

  await pool.end()
}

main().catch(console.error)
