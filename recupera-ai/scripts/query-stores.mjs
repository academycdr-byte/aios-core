import { createRequire } from 'module'
import { resolve } from 'path'

const require = createRequire(import.meta.url)
const { PrismaClient } = require(resolve(process.cwd(), 'src/generated/prisma'))

const prisma = new PrismaClient()

const stores = await prisma.store.findMany({
  select: { id: true, name: true, platform: true, whatsappConnected: true, whatsappPhone: true, testMode: true, testPhones: true, isActive: true }
})
console.log(JSON.stringify(stores, null, 2))
await prisma.$disconnect()
