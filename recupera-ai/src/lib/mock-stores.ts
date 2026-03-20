import type { Platform } from '@/generated/prisma/enums'

export interface MockStore {
  id: string
  name: string
  platform: Platform
  domain: string
  shopifyDomain?: string
  nuvemshopStoreId?: string
  whatsappPhone?: string
  whatsappConnected: boolean
  isActive: boolean
  todayAbandoned: number
  todayRecovered: number
}

export interface MockStoreSettings {
  id: string
  storeId: string
  storeName: string | null
  storeDescription: string | null
  mainProducts: string | null
  targetAudience: string | null
  shippingPolicy: string | null
  returnPolicy: string | null
  paymentMethods: string | null
  warrantyPolicy: string | null
  faqContent: string | null
  currentOffers: string | null
  canOfferDiscount: boolean
  maxDiscountPercent: number | null
  couponCode: string | null
  couponDiscount: number | null
  aiTone: string
  aiName: string
  customInstructions: string | null
  businessHoursStart: string | null
  businessHoursEnd: string | null
  sendOutsideHours: boolean
  timezone: string
  sellerName: string | null
  sellerPersona: string | null
  deliveryTimeframes: string | null
  sizeGuide: string | null
  productSpecs: string | null
}

export interface MockRecoveryConfig {
  id: string
  storeId: string
  isActive: boolean
  firstMessageDelay: number
  followUp1Delay: number
  followUp2Delay: number
  followUp3Delay: number | null
  maxAttempts: number
  firstMessageTemplate: string | null
  followUp1Template: string | null
  followUp2Template: string | null
  followUp3Template: string | null
  minCartValue: number
  pixRecoveryEnabled: boolean
  pixFirstDelay: number
  pixFollowUpDelay: number
  pixMaxAttempts: number
  cardRecoveryEnabled: boolean
  cardFirstDelay: number
  cardMaxAttempts: number
  stopOnOptOut: boolean
  expirationHours: number
}

export const mockStores: MockStore[] = [
  {
    id: '1',
    name: 'Manto da Classe',
    platform: 'SHOPIFY',
    domain: 'mantodaclasse.com.br',
    shopifyDomain: 'manto-da-classe.myshopify.com',
    whatsappPhone: '+5511999999999',
    whatsappConnected: true,
    isActive: true,
    todayAbandoned: 12,
    todayRecovered: 3,
  },
  {
    id: '2',
    name: 'FutFanatics',
    platform: 'NUVEMSHOP',
    domain: 'futfanatics.com.br',
    nuvemshopStoreId: '12345',
    whatsappPhone: '+5511988888888',
    whatsappConnected: true,
    isActive: true,
    todayAbandoned: 28,
    todayRecovered: 7,
  },
  {
    id: '3',
    name: 'Nike Store Test',
    platform: 'SHOPIFY',
    domain: 'niketest.com.br',
    shopifyDomain: 'nike-test.myshopify.com',
    whatsappConnected: false,
    isActive: false,
    todayAbandoned: 0,
    todayRecovered: 0,
  },
]

export const mockStoreSettings: Record<string, MockStoreSettings> = {
  '1': {
    id: 'settings-1',
    storeId: '1',
    storeName: 'Manto da Classe',
    storeDescription: 'Loja especializada em camisas de futebol originais e replicadas dos maiores clubes do Brasil e do mundo.',
    mainProducts: 'Camisas de futebol, agasalhos, shorts, meias esportivas',
    targetAudience: 'Homens 18-45 anos, apaixonados por futebol, classes B e C',
    shippingPolicy: 'Frete gratis acima de R$299. Entrega em 3-7 dias uteis para todo o Brasil. Envio via Correios e transportadoras.',
    returnPolicy: 'Troca gratuita em ate 30 dias. Devolucao com reembolso em ate 7 dias uteis apos recebimento.',
    paymentMethods: 'PIX (5% desconto), Cartao de credito (ate 12x sem juros), Boleto bancario',
    warrantyPolicy: 'Garantia de 90 dias contra defeitos de fabricacao.',
    faqContent: 'Todas as camisas sao originais? Sim, trabalhamos apenas com fornecedores autorizados.',
    currentOffers: 'Frete gratis acima de R$299. 5% desconto no PIX.',
    canOfferDiscount: true,
    maxDiscountPercent: 10,
    couponCode: 'VOLTA10',
    couponDiscount: 10,
    aiTone: 'amigavel',
    aiName: 'Manto',
    customInstructions: 'Sempre mencionar que temos frete gratis acima de R$299. Usar linguagem de torcedor. Nunca oferecer desconto maior que 10%.',
    businessHoursStart: '08:00',
    businessHoursEnd: '22:00',
    sendOutsideHours: false,
    timezone: 'America/Sao_Paulo',
    sellerName: null,
    sellerPersona: null,
    deliveryTimeframes: null,
    sizeGuide: null,
    productSpecs: null,
  },
  '2': {
    id: 'settings-2',
    storeId: '2',
    storeName: 'FutFanatics',
    storeDescription: 'Maior loja online de artigos esportivos do Brasil. Camisas oficiais, chuteiras, e acessorios.',
    mainProducts: 'Camisas oficiais, chuteiras, bolas, acessorios esportivos',
    targetAudience: 'Homens e mulheres 16-50 anos, praticantes e fas de futebol',
    shippingPolicy: 'Frete gratis acima de R$199. Entrega expressa disponivel.',
    returnPolicy: 'Primeira troca gratis. Devolucao em ate 7 dias.',
    paymentMethods: 'PIX, Cartao (ate 10x sem juros), Boleto',
    warrantyPolicy: 'Garantia de 90 dias.',
    faqContent: '',
    currentOffers: 'Liquidacao de inverno: ate 40% off em selecao de produtos.',
    canOfferDiscount: true,
    maxDiscountPercent: 15,
    couponCode: 'FUT15',
    couponDiscount: 15,
    aiTone: 'profissional',
    aiName: 'Assistente FutFanatics',
    customInstructions: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '21:00',
    sendOutsideHours: true,
    timezone: 'America/Sao_Paulo',
    sellerName: null,
    sellerPersona: null,
    deliveryTimeframes: null,
    sizeGuide: null,
    productSpecs: null,
  },
  '3': {
    id: 'settings-3',
    storeId: '3',
    storeName: 'Nike Store Test',
    storeDescription: '',
    mainProducts: '',
    targetAudience: '',
    shippingPolicy: '',
    returnPolicy: '',
    paymentMethods: '',
    warrantyPolicy: '',
    faqContent: '',
    currentOffers: '',
    canOfferDiscount: false,
    maxDiscountPercent: 0,
    couponCode: '',
    couponDiscount: 0,
    aiTone: 'profissional',
    aiName: 'Assistente',
    customInstructions: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    sendOutsideHours: false,
    timezone: 'America/Sao_Paulo',
    sellerName: null,
    sellerPersona: null,
    deliveryTimeframes: null,
    sizeGuide: null,
    productSpecs: null,
  },
}

export const mockRecoveryConfigs: Record<string, MockRecoveryConfig> = {
  '1': {
    id: 'recovery-1',
    storeId: '1',
    isActive: true,
    firstMessageDelay: 30,
    followUp1Delay: 360,
    followUp2Delay: 1440,
    followUp3Delay: null,
    maxAttempts: 3,
    firstMessageTemplate: '',
    followUp1Template: '',
    followUp2Template: '',
    followUp3Template: '',
    minCartValue: 50,
    pixRecoveryEnabled: true,
    pixFirstDelay: 15,
    pixFollowUpDelay: 120,
    pixMaxAttempts: 2,
    cardRecoveryEnabled: true,
    cardFirstDelay: 10,
    cardMaxAttempts: 2,
    stopOnOptOut: true,
    expirationHours: 72,
  },
  '2': {
    id: 'recovery-2',
    storeId: '2',
    isActive: true,
    firstMessageDelay: 20,
    followUp1Delay: 240,
    followUp2Delay: 720,
    followUp3Delay: 2880,
    maxAttempts: 4,
    firstMessageTemplate: 'Oi {nome}! Vi que voce deixou alguns itens no carrinho. Posso ajudar?',
    followUp1Template: '',
    followUp2Template: '',
    followUp3Template: '',
    minCartValue: 30,
    pixRecoveryEnabled: true,
    pixFirstDelay: 10,
    pixFollowUpDelay: 60,
    pixMaxAttempts: 3,
    cardRecoveryEnabled: false,
    cardFirstDelay: 15,
    cardMaxAttempts: 2,
    stopOnOptOut: true,
    expirationHours: 48,
  },
  '3': {
    id: 'recovery-3',
    storeId: '3',
    isActive: false,
    firstMessageDelay: 30,
    followUp1Delay: 360,
    followUp2Delay: 1440,
    followUp3Delay: null,
    maxAttempts: 3,
    firstMessageTemplate: '',
    followUp1Template: '',
    followUp2Template: '',
    followUp3Template: '',
    minCartValue: 0,
    pixRecoveryEnabled: false,
    pixFirstDelay: 15,
    pixFollowUpDelay: 120,
    pixMaxAttempts: 2,
    cardRecoveryEnabled: false,
    cardFirstDelay: 15,
    cardMaxAttempts: 2,
    stopOnOptOut: true,
    expirationHours: 72,
  },
}

export function getStoreById(id: string): MockStore | undefined {
  return mockStores.find((s) => s.id === id)
}

export function getStoreSettings(storeId: string): MockStoreSettings | undefined {
  return mockStoreSettings[storeId]
}

export function getRecoveryConfig(storeId: string): MockRecoveryConfig | undefined {
  return mockRecoveryConfigs[storeId]
}
