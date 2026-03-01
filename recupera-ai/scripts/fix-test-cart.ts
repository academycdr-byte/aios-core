import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CART_ID = 'cmm7ub70t000080vhskof9g73'

async function main() {
  // Fix cartItems: should be JSON array, not stringified JSON
  const cart = await prisma.abandonedCart.update({
    where: { id: CART_ID },
    data: {
      cartItems: [
        {
          name: 'Camisa Flamengo 2025/26 - Adidas',
          quantity: 1,
          price: 249.90,
          image: 'https://spacesports.com.br/camisa-fla.jpg',
        },
      ],
      // Reset abandonedAt to 35min ago so delay is passed again
      abandonedAt: new Date(Date.now() - 35 * 60 * 1000),
    },
  })

  console.log('Cart fixed:', {
    id: cart.id,
    cartItems: cart.cartItems,
    abandonedAt: cart.abandonedAt,
  })

  await pool.end()
}

main().catch(console.error)
