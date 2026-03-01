import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, platform: true, whatsappConnected: true, whatsappPhone: true, testMode: true, testPhones: true, isActive: true }
  })
  console.log(JSON.stringify(stores, null, 2))
  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
