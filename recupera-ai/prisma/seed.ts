// @ts-nocheck
import 'dotenv/config'
import crypto from 'crypto'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const mod = await import('../src/generated/prisma/client.ts')
  const PrismaClient = mod.PrismaClient

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('Seeding database...')

  // Create user
  const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex')

  const user = await prisma.user.upsert({
    where: { email: 'ivan@cdrgroup.com.br' },
    update: {},
    create: {
      email: 'ivan@cdrgroup.com.br',
      name: 'Ivan Furtado',
      password: passwordHash,
      avatar: null,
    },
  })
  console.log(`User created: ${user.email}`)

  // Create stores
  const store1 = await prisma.store.create({
    data: {
      userId: user.id,
      name: 'Manto da Classe',
      platform: 'SHOPIFY',
      domain: 'mantodaclasse.com.br',
      shopifyDomain: 'manto-da-classe.myshopify.com',
      whatsappConnected: false,
      isActive: true,
      webhookSecret: crypto.randomBytes(32).toString('hex'),
    },
  })

  const store2 = await prisma.store.create({
    data: {
      userId: user.id,
      name: 'FutFanatics',
      platform: 'NUVEMSHOP',
      domain: 'futfanatics.com.br',
      nuvemshopStoreId: '2847361',
      whatsappConnected: false,
      isActive: true,
      webhookSecret: crypto.randomBytes(32).toString('hex'),
    },
  })
  console.log(`Stores created: ${store1.name}, ${store2.name}`)

  // Create store settings
  await prisma.storeSettings.create({
    data: {
      storeId: store1.id,
      storeName: 'Manto da Classe',
      storeDescription: 'E-commerce de camisas de futebol retro e oficiais.',
      mainProducts: 'Camisas de futebol retro, camisas oficiais',
      targetAudience: 'Torcedores apaixonados, 18-45 anos',
      shippingPolicy: 'Frete gratis acima de R$299. Envio em ate 3 dias uteis.',
      returnPolicy: 'Troca gratis em ate 30 dias.',
      paymentMethods: 'PIX (5% desconto), cartao ate 6x sem juros, boleto',
      canOfferDiscount: true,
      maxDiscountPercent: 10,
      couponCode: 'VOLTA10',
      couponDiscount: 10,
      aiTone: 'amigavel',
      aiName: 'Ana',
      customInstructions: 'Mencionar qualidade e paixao pelo futebol.',
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      sendOutsideHours: false,
      timezone: 'America/Sao_Paulo',
    },
  })

  await prisma.storeSettings.create({
    data: {
      storeId: store2.id,
      storeName: 'FutFanatics',
      storeDescription: 'Maior loja de artigos esportivos online do Brasil.',
      mainProducts: 'Camisas oficiais, tenis, shorts, acessorios',
      targetAudience: 'Torcedores de todos os clubes',
      shippingPolicy: 'Frete gratis acima de R$199.',
      returnPolicy: 'Primeira troca gratis em ate 30 dias.',
      paymentMethods: 'PIX (8% desconto), cartao ate 10x sem juros, boleto, PayPal',
      canOfferDiscount: true,
      maxDiscountPercent: 15,
      couponCode: 'RECUPERA15',
      couponDiscount: 15,
      aiTone: 'profissional',
      aiName: 'Carlos',
      businessHoursStart: '08:00',
      businessHoursEnd: '20:00',
      sendOutsideHours: true,
      timezone: 'America/Sao_Paulo',
    },
  })
  console.log('Store settings created')

  // Create recovery configs
  await prisma.recoveryConfig.create({
    data: { storeId: store1.id, isActive: true, firstMessageDelay: 30, followUp1Delay: 360, followUp2Delay: 1440, maxAttempts: 3, minCartValue: 50, pixRecoveryEnabled: true, pixFirstDelay: 15, pixFollowUpDelay: 120, pixMaxAttempts: 2, cardRecoveryEnabled: true, cardFirstDelay: 10, cardMaxAttempts: 2 },
  })
  await prisma.recoveryConfig.create({
    data: { storeId: store2.id, isActive: true, firstMessageDelay: 20, followUp1Delay: 240, followUp2Delay: 720, followUp3Delay: 2880, maxAttempts: 4, minCartValue: 100, pixRecoveryEnabled: true, pixFirstDelay: 10, pixFollowUpDelay: 60, pixMaxAttempts: 3, cardRecoveryEnabled: true, cardFirstDelay: 5, cardMaxAttempts: 2 },
  })
  console.log('Recovery configs created')

  // Create sample abandoned carts
  const now = new Date()
  const cartData = [
    { name: 'Joao Silva', email: 'joao@email.com', phone: '5511999887766', total: 389.90, items: [{ name: 'Camisa Flamengo Retro 1981', qty: 1, price: 249.90 }, { name: 'Shorts Casual', qty: 1, price: 140.00 }], type: 'ABANDONED_CART', status: 'PENDING', hoursAgo: 1 },
    { name: 'Maria Santos', email: 'maria@email.com', phone: '5521988776655', total: 529.90, items: [{ name: 'Camisa Brasil 2026', qty: 2, price: 264.95 }], type: 'ABANDONED_CART', status: 'CONTACTING', hoursAgo: 3 },
    { name: 'Pedro Oliveira', email: 'pedro@email.com', phone: '5531977665544', total: 199.90, items: [{ name: 'Camisa Corinthians III', qty: 1, price: 199.90 }], type: 'PIX_PENDING', status: 'PENDING', hoursAgo: 0.5 },
    { name: 'Ana Rodrigues', email: 'ana@email.com', phone: '5541966554433', total: 459.80, items: [{ name: 'Kit Palmeiras Completo', qty: 1, price: 459.80 }], type: 'ABANDONED_CART', status: 'RECOVERED', hoursAgo: 24 },
    { name: 'Carlos Mendes', email: 'carlos@email.com', phone: '5511955443322', total: 149.90, items: [{ name: 'Meiao Oficial', qty: 3, price: 49.97 }], type: 'CARD_DECLINED', status: 'PENDING', hoursAgo: 2 },
    { name: 'Lucia Ferreira', email: 'lucia@email.com', phone: '5521944332211', total: 679.90, items: [{ name: 'Camisa Vasco Retro', qty: 1, price: 289.90 }, { name: 'Camisa Sao Paulo', qty: 1, price: 390.00 }], type: 'ABANDONED_CART', status: 'CONTACTING', hoursAgo: 6 },
    { name: 'Ricardo Alves', email: 'ricardo@email.com', phone: '5531933221100', total: 299.90, items: [{ name: 'Tenis Nike Football', qty: 1, price: 299.90 }], type: 'PIX_PENDING', status: 'PAID', hoursAgo: 48 },
    { name: 'Fernanda Costa', email: 'fernanda@email.com', phone: '5541922110099', total: 189.90, items: [{ name: 'Camisa Gremio Away', qty: 1, price: 189.90 }], type: 'ABANDONED_CART', status: 'LOST', hoursAgo: 72 },
  ]

  const carts = []
  for (const data of cartData) {
    const storeId = Math.random() > 0.5 ? store1.id : store2.id
    const cart = await prisma.abandonedCart.create({
      data: {
        storeId,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        cartTotal: data.total,
        cartItems: data.items,
        itemCount: data.items.length,
        type: data.type,
        status: data.status,
        recoveryAttempts: data.status === 'CONTACTING' ? 1 : ['RECOVERED', 'PAID'].includes(data.status) ? 2 : 0,
        abandonedAt: new Date(now.getTime() - data.hoursAgo * 3600000),
        recoveredAt: ['RECOVERED', 'PAID'].includes(data.status) ? new Date(now.getTime() - (data.hoursAgo - 1) * 3600000) : null,
        recoveredValue: ['RECOVERED', 'PAID'].includes(data.status) ? data.total : null,
        paidAt: data.status === 'PAID' ? new Date(now.getTime() - (data.hoursAgo - 2) * 3600000) : null,
        paidValue: data.status === 'PAID' ? data.total : null,
      },
    })
    carts.push(cart)
  }
  console.log(`${carts.length} abandoned carts created`)

  // Create conversations for CONTACTING/RECOVERED/PAID carts
  const contactingIndices = cartData.map((d, i) => ['CONTACTING', 'RECOVERED', 'PAID'].includes(d.status) ? i : -1).filter(i => i >= 0)
  for (const idx of contactingIndices) {
    const cart = carts[idx]
    const cartInfo = cartData[idx]
    const conv = await prisma.conversation.create({
      data: {
        storeId: cart.storeId,
        abandonedCartId: cart.id,
        customerPhone: cart.customerPhone,
        customerName: cart.customerName,
        status: ['RECOVERED', 'PAID'].includes(cartInfo.status) ? 'RECOVERED' : 'ACTIVE',
        aiModel: 'gpt-4o-mini',
        totalTokens: Math.floor(Math.random() * 2000) + 500,
        estimatedCost: Math.random() * 0.05,
        lastMessageAt: new Date(),
      },
    })
    await prisma.message.createMany({
      data: [
        { conversationId: conv.id, role: 'AI', content: `Ola ${cart.customerName?.split(' ')[0]}! Vi que voce estava olhando nossos produtos. Posso te ajudar?`, messageStatus: 'DELIVERED', sentAt: new Date(now.getTime() - 3600000) },
        { conversationId: conv.id, role: 'CUSTOMER', content: 'Oi! Sim, achei o frete caro...', messageStatus: 'READ', sentAt: new Date(now.getTime() - 3500000) },
        { conversationId: conv.id, role: 'AI', content: 'Entendo! Acima de R$299 o frete e gratis! E tenho um cupom de 10% pra voce: VOLTA10', messageStatus: 'DELIVERED', sentAt: new Date(now.getTime() - 3400000) },
      ],
    })
  }
  console.log('Conversations and messages created')

  // Create daily metrics (last 30 days)
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    date.setHours(0, 0, 0, 0)
    const abandoned = Math.floor(Math.random() * 15) + 5
    const contacted = Math.floor(abandoned * (0.6 + Math.random() * 0.3))
    const recovered = Math.floor(contacted * (0.2 + Math.random() * 0.2))
    const paid = Math.floor(recovered * (0.7 + Math.random() * 0.3))
    const avgTicket = 180 + Math.random() * 200
    for (const storeId of [store1.id, store2.id]) {
      await prisma.dailyMetrics.create({
        data: { storeId, date, abandonedCount: abandoned, abandonedValue: abandoned * avgTicket, contactedCount: contacted, recoveredCount: recovered, recoveredValue: recovered * avgTicket, paidCount: paid, paidValue: paid * avgTicket, avgTicket, recoveryRate: contacted > 0 ? recovered / contacted : 0, totalConversations: contacted, avgMessagesPerConv: 3 + Math.random() * 4, aiCost: contacted * 0.03 },
      })
    }
  }
  console.log('30 days of daily metrics created')
  console.log('Seed complete!')

  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
