import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CART_ID = 'cmm7ub70t000080vhskof9g73'

async function main() {
  // Set lastAttemptAt to 25h ago so any delay has passed
  // Cart already has recoveryAttempts=3 and maxAttempts=3
  // So next cron should mark it as LOST
  await prisma.abandonedCart.update({
    where: { id: CART_ID },
    data: {
      lastAttemptAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    },
  })

  console.log('Ready to test LOST transition. Cart has 3/3 attempts.')

  await pool.end()
}

main().catch(console.error)
