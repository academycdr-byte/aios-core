import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STORE_ID = 'cmm54nwiv000004lbfyiacicl'

async function main() {
  // 1. Populate StoreSettings (Knowledge Base)
  const settings = await prisma.storeSettings.upsert({
    where: { storeId: STORE_ID },
    update: {
      storeName: 'Space Sports',
      storeDescription: 'Loja especializada em camisas de time oficiais e retro. Trabalhamos com os maiores clubes do Brasil e do mundo, oferecendo qualidade e autenticidade em cada produto.',
      mainProducts: 'Camisas de futebol oficiais, camisas retro, agasalhos, shorts esportivos, camisas de selecoes',
      targetAudience: 'Homens e mulheres de 18 a 45 anos, apaixonados por futebol, que buscam camisas de qualidade para torcer ou colecionar',
      shippingPolicy: 'Frete gratis para compras acima de R$299. Entrega em 3 a 8 dias uteis para todo o Brasil via Correios e transportadoras. Rastreamento disponivel apos o envio.',
      returnPolicy: 'Troca gratuita em ate 30 dias apos o recebimento. Produto deve estar sem uso e com etiqueta. Devolucao com reembolso integral em ate 7 dias uteis.',
      paymentMethods: 'PIX com 5% de desconto, Cartao de credito em ate 12x sem juros, Boleto bancario',
      warrantyPolicy: 'Garantia de 90 dias contra defeitos de fabricacao. Produtos oficiais possuem selo de autenticidade.',
      faqContent: 'P: As camisas sao originais?\nR: Sim, todas as camisas sao 100% originais com nota fiscal e selo de autenticidade.\n\nP: Qual o prazo de entrega?\nR: De 3 a 8 dias uteis para todo o Brasil.\n\nP: Posso trocar o tamanho?\nR: Sim, troca gratuita em ate 30 dias.',
      currentOffers: 'Frete gratis acima de R$299. 5% de desconto no PIX. Compre 2 camisas e ganhe 10% off na segunda.',
      canOfferDiscount: true,
      maxDiscountPercent: 10,
      couponCode: 'VOLTA10',
      couponDiscount: 10,
      aiTone: 'amigavel',
      aiName: 'Space',
      customInstructions: 'Use linguagem de torcedor, informal mas respeitosa. Sempre mencione o frete gratis acima de R$299. Nunca oferecer desconto maior que 10%. Se o cliente perguntar sobre entrega internacional, informe que no momento atendemos apenas Brasil.',
      businessHoursStart: '08:00',
      businessHoursEnd: '22:00',
      sendOutsideHours: false,
      timezone: 'America/Sao_Paulo',
    },
    create: {
      storeId: STORE_ID,
      storeName: 'Space Sports',
      storeDescription: 'Loja especializada em camisas de time oficiais e retro.',
      mainProducts: 'Camisas de futebol oficiais, camisas retro, agasalhos',
      targetAudience: 'Homens e mulheres de 18 a 45 anos, apaixonados por futebol',
      shippingPolicy: 'Frete gratis acima de R$299. Entrega em 3 a 8 dias uteis.',
      returnPolicy: 'Troca gratuita em ate 30 dias.',
      paymentMethods: 'PIX, Cartao 12x, Boleto',
      warrantyPolicy: 'Garantia de 90 dias.',
      faqContent: '',
      currentOffers: 'Frete gratis acima de R$299.',
      canOfferDiscount: true,
      maxDiscountPercent: 10,
      couponCode: 'VOLTA10',
      couponDiscount: 10,
      aiTone: 'amigavel',
      aiName: 'Space',
      customInstructions: '',
      businessHoursStart: '08:00',
      businessHoursEnd: '22:00',
      sendOutsideHours: false,
      timezone: 'America/Sao_Paulo',
    },
  })
  console.log('Settings populated:', settings.storeName)

  // 2. Create Recovery Stages (3-stage escalation)
  // Delete existing first
  await prisma.recoveryStage.deleteMany({ where: { storeId: STORE_ID } })

  const stages = [
    {
      storeId: STORE_ID,
      name: 'Abordagem Inicial',
      order: 1,
      objective: 'Lembrar o cliente do carrinho de forma amigavel, sem pressao. Gerar curiosidade e reconexao.',
      aiInstructions: 'Seja amigavel e casual. Mencione o produto pelo nome. Pergunte se precisa de ajuda. NAO oferecer desconto nesta fase.',
      discountEnabled: false,
      discountPercent: null,
      firstMessageTone: 'amigavel',
      firstMessageElements: 'nome_cliente,produto,pergunta_aberta',
      isDefault: true,
    },
    {
      storeId: STORE_ID,
      name: 'Incentivo',
      order: 2,
      objective: 'Criar urgencia leve e oferecer beneficio. Resolver objecoes comuns (frete, troca, pagamento).',
      aiInstructions: 'Mencione beneficios como frete gratis, troca facil, parcelamento. Se o cliente demonstrou interesse, oferecer cupom VOLTA10 com 10% de desconto. Crie leve urgencia.',
      discountEnabled: true,
      discountPercent: 10,
      firstMessageTone: null,
      firstMessageElements: null,
      isDefault: true,
    },
    {
      storeId: STORE_ID,
      name: 'Ultima Tentativa',
      order: 3,
      objective: 'Ultima mensagem antes de encerrar. Tom de despedida amigavel, deixando porta aberta.',
      aiInstructions: 'Mensagem curta e respeitosa de despedida. Lembre que o cupom ainda esta disponivel. Deseje um bom dia. NAO pressione.',
      discountEnabled: true,
      discountPercent: 10,
      firstMessageTone: null,
      firstMessageElements: null,
      isDefault: true,
    },
  ]

  for (const stage of stages) {
    await prisma.recoveryStage.create({ data: stage })
  }
  console.log('Created 3 recovery stages')

  // 3. Create Follow-Up Steps for ABANDONED_CART
  const configId = (await prisma.recoveryConfig.findUnique({ where: { storeId: STORE_ID } }))?.id
  if (configId) {
    await prisma.followUpStep.deleteMany({ where: { configId } })

    const steps = [
      { configId, cartType: 'ABANDONED_CART' as const, stepNumber: 0, delayMinutes: 30, strategy: 'Primeira mensagem: abordagem amigavel, lembrar do carrinho', isActive: true },
      { configId, cartType: 'ABANDONED_CART' as const, stepNumber: 1, delayMinutes: 360, strategy: 'Follow-up 1: oferecer ajuda, mencionar beneficios (frete, troca)', isActive: true },
      { configId, cartType: 'ABANDONED_CART' as const, stepNumber: 2, delayMinutes: 1440, strategy: 'Follow-up 2: oferecer cupom VOLTA10, criar urgencia leve', isActive: true },
    ]

    for (const step of steps) {
      await prisma.followUpStep.create({ data: step })
    }
    console.log('Created 3 follow-up steps')
  }

  console.log('\nStore ready for QA testing!')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
