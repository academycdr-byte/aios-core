import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STORE_ID = 'cmm54nwiv000004lbfyiacicl'

async function main() {
  // Check settings
  const settings = await prisma.storeSettings.findUnique({ where: { storeId: STORE_ID } })
  console.log('=== SETTINGS ===')
  console.log(settings ? `storeName: ${settings.storeName}, aiTone: ${settings.aiTone}, aiName: ${settings.aiName}` : 'NO SETTINGS')
  console.log(`  storeDescription: ${settings?.storeDescription?.substring(0, 80) ?? 'null'}`)
  console.log(`  mainProducts: ${settings?.mainProducts?.substring(0, 80) ?? 'null'}`)

  // Check recovery config
  const config = await prisma.recoveryConfig.findUnique({ where: { storeId: STORE_ID } })
  console.log('\n=== RECOVERY CONFIG ===')
  console.log(config ? `isActive: ${config.isActive}, firstDelay: ${config.firstMessageDelay}min, maxAttempts: ${config.maxAttempts}` : 'NO CONFIG')

  // Check recovery stages
  const stages = await prisma.recoveryStage.findMany({ where: { storeId: STORE_ID }, orderBy: { order: 'asc' } })
  console.log(`\n=== STAGES (${stages.length}) ===`)
  stages.forEach(s => console.log(`  Stage ${s.order}: ${s.name} — discount: ${s.discountEnabled ? s.discountPercent + '%' : 'no'}`))

  // Check follow-up steps
  const steps = await prisma.followUpStep.findMany({
    where: { config: { storeId: STORE_ID } },
    orderBy: [{ cartType: 'asc' }, { stepNumber: 'asc' }]
  })
  console.log(`\n=== FOLLOW-UP STEPS (${steps.length}) ===`)
  steps.forEach(s => console.log(`  ${s.cartType} step ${s.stepNumber}: ${s.delayMinutes}min, active: ${s.isActive}`))

  // Check abandoned carts
  const carts = await prisma.abandonedCart.findMany({
    where: { storeId: STORE_ID },
    orderBy: { abandonedAt: 'desc' },
    take: 5,
    select: { id: true, customerName: true, customerPhone: true, cartTotal: true, status: true, type: true, recoveryAttempts: true, abandonedAt: true }
  })
  console.log(`\n=== RECENT CARTS (${carts.length}) ===`)
  carts.forEach(c => console.log(`  ${c.id.substring(0, 12)}... | ${c.customerName ?? 'anon'} | ${c.customerPhone ?? 'no-phone'} | R$${c.cartTotal} | ${c.status} | ${c.type} | attempts: ${c.recoveryAttempts}`))

  // Check conversations
  const convs = await prisma.conversation.count({ where: { storeId: STORE_ID } })
  console.log(`\n=== CONVERSATIONS: ${convs} ===`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
