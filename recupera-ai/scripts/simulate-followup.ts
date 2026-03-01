import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CART_ID = 'cmm7ub70t000080vhskof9g73'

async function main() {
  // Simulate time passing: set lastAttemptAt to 7 hours ago
  // Follow-up step 1 has delay of 360min (6h), so 7h ago triggers it
  const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000)

  await prisma.abandonedCart.update({
    where: { id: CART_ID },
    data: {
      lastAttemptAt: sevenHoursAgo,
      abandonedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
    },
  })

  console.log('Cart updated: lastAttemptAt set to 7h ago to trigger follow-up step 1')
  console.log('Now call the cron endpoint to trigger the 2nd message')

  await pool.end()
}

main().catch(console.error)
