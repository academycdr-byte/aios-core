import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const updated = await prisma.store.update({
    where: { id: 'cmm54nwiv000004lbfyiacicl' },
    data: {
      testMode: true,
      testPhones: ['5535998717592'],
    },
    select: { id: true, name: true, testMode: true, testPhones: true }
  })
  console.log('testMode ativado:', JSON.stringify(updated, null, 2))
  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
