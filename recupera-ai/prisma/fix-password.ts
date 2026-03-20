import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const hashed = await bcrypt.hash('admin123', 12)
  console.log('Bcrypt hash generated:', hashed.substring(0, 7) + '...')

  const user = await prisma.user.update({
    where: { email: 'ivan@cdrgroup.com.br' },
    data: { password: hashed },
  })

  console.log('Password updated for:', user.email)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
