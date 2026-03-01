import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STORE_ID = 'cmm54nwiv000004lbfyiacicl'
const TEST_PHONE = '5535998717592'

async function main() {
  // Check current follow-up steps to understand delay
  const config = await prisma.recoveryConfig.findUnique({
    where: { storeId: STORE_ID },
    include: { followUpSteps: { orderBy: { stepNumber: 'asc' } } },
  })
  console.log('Follow-up steps:', config?.followUpSteps.map(s => ({
    step: s.stepNumber,
    delay: s.delayMinutes,
    strategy: s.strategy,
  })))

  // Create abandoned cart 35 minutes ago (first step delay is 30min)
  const abandonedAt = new Date(Date.now() - 35 * 60 * 1000)

  const cart = await prisma.abandonedCart.create({
    data: {
      storeId: STORE_ID,
      customerName: 'Ivan Teste',
      customerEmail: 'ivan@cdrgroup.com.br',
      customerPhone: TEST_PHONE,
      cartTotal: 249.90,
      currency: 'BRL',
      cartItems: JSON.stringify([
        {
          name: 'Camisa Flamengo 2025/26 - Adidas',
          quantity: 1,
          price: 249.90,
          image: 'https://spacesports.com.br/camisa-fla.jpg',
        },
      ]),
      itemCount: 1,
      checkoutUrl: 'https://spacesports.com.br/checkout/abc123',
      type: 'ABANDONED_CART',
      status: 'PENDING',
      recoveryAttempts: 0,
      abandonedAt,
    },
  })

  console.log('Test cart created:', {
    id: cart.id,
    phone: cart.customerPhone,
    total: cart.cartTotal,
    abandonedAt: cart.abandonedAt,
    status: cart.status,
  })

  await pool.end()
}

main().catch(console.error)
