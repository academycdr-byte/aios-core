/**
 * System Prompt Builder
 * Constructs the AI system prompt from store settings, recovery config, and cart data.
 * The prompt shapes the AI's identity, tone, knowledge, and behavioral rules.
 */

import type { StoreSettings, RecoveryConfig, AbandonedCart, CartItem, RecoveryStage } from '@/types'

// ============================================================
// TONE DESCRIPTIONS
// ============================================================

const TONE_MAP: Record<string, string> = {
  profissional:
    'Seja profissional e objetivo. Use linguagem clara, educada e direta. Transmita confiança e credibilidade.',
  amigavel:
    'Seja amigável e acolhedor. Use linguagem leve, próxima e calorosa. Trate o cliente como um amigo que você quer ajudar.',
  casual:
    'Seja casual e descontraído. Use linguagem informal, gírias leves e um tom jovem. Fale como se estivesse batendo papo.',
  persuasivo:
    'Seja persuasivo e estratégico. Use gatilhos de urgência, escassez e prova social quando pertinente. Foque nos benefícios, não nas características.',
}

// ============================================================
// CART TYPE LABELS
// ============================================================

const CART_TYPE_LABEL: Record<string, string> = {
  ABANDONED_CART: 'Carrinho abandonado',
  PIX_PENDING: 'Pix pendente',
  CARD_DECLINED: 'Cartão recusado',
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

function buildCartItemsText(items: CartItem[]): string {
  if (!items || items.length === 0) return '- (sem itens detalhados)'
  return items
    .map((item) => {
      const variant = item.variant ? ` (${item.variant})` : ''
      const price = formatCurrency(item.price)
      return `- ${item.name}${variant} x${item.quantity} - ${price}`
    })
    .join('\n')
}

function buildOffersSection(settings: StoreSettings): string {
  const lines: string[] = []

  if (settings.currentOffers) {
    lines.push(settings.currentOffers)
  }

  if (settings.canOfferDiscount) {
    if (settings.couponCode && settings.couponDiscount) {
      lines.push(
        `Você pode oferecer o cupom ${settings.couponCode} com ${settings.couponDiscount}% de desconto.`
      )
    } else if (settings.maxDiscountPercent) {
      lines.push(
        `Você pode oferecer até ${settings.maxDiscountPercent}% de desconto se o cliente hesitar.`
      )
    }
  } else {
    lines.push('Não há ofertas ou descontos disponíveis no momento. NÃO invente cupons.')
  }

  return lines.join('\n')
}

function buildBusinessHoursText(settings: StoreSettings): string {
  if (!settings.businessHoursStart || !settings.businessHoursEnd) {
    return ''
  }
  return `\n## Horário de funcionamento\n- Atendimento: ${settings.businessHoursStart} às ${settings.businessHoursEnd} (${settings.timezone})\n- Se o cliente enviar mensagem fora do horário, informe educadamente o horário de atendimento.`
}

// ============================================================
// MAIN BUILDER
// ============================================================

/**
 * Builds the complete system prompt for the AI recovery agent.
 *
 * @param settings - Store settings (name, policies, AI config)
 * @param config  - Recovery config (timing, templates)
 * @param cart    - The abandoned cart being recovered (optional for generic conversations)
 * @param stage   - Current recovery stage (optional, adds stage-specific instructions)
 */
export function buildSystemPrompt(
  settings: StoreSettings,
  config: RecoveryConfig | null,
  cart: AbandonedCart | null,
  stage?: RecoveryStage | null
): string {
  const aiName = settings.aiName || 'Assistente'
  const storeName = settings.storeName || 'a loja'
  const toneDescription = TONE_MAP[settings.aiTone] || TONE_MAP.profissional

  // --- Seller identity (prefer sellerName over aiName) ---
  const sellerIdentity = settings.sellerName || aiName

  // --- Seller persona section ---
  const personaDescription = settings.sellerPersona
    ? `\n## Sua identidade como vendedor\n${settings.sellerPersona}`
    : ''

  // --- Product details section ---
  let productDetailsSection = ''
  const productDetails: string[] = []
  if (settings.deliveryTimeframes) productDetails.push(`- Prazos de entrega: ${settings.deliveryTimeframes}`)
  if (settings.sizeGuide) productDetails.push(`- Tabela de tamanhos: ${settings.sizeGuide}`)
  if (settings.productSpecs) productDetails.push(`- Especificações técnicas: ${settings.productSpecs}`)
  if (productDetails.length > 0) {
    productDetailsSection = `\n## Detalhes dos Produtos\n${productDetails.join('\n')}`
  }

  // --- Cart section (only if cart is provided) ---
  let cartSection = ''
  if (cart) {
    const cartTypeLabel = CART_TYPE_LABEL[cart.type] || cart.type
    const items = (cart.cartItems ?? []) as CartItem[]
    cartSection = `
## O cliente abandonou o seguinte carrinho:
- Tipo: ${cartTypeLabel}
- Valor total: ${formatCurrency(cart.cartTotal, cart.currency)}
- Quantidade de itens: ${cart.itemCount}
- Produtos:
${buildCartItemsText(items)}${cart.checkoutUrl ? `\n- Link para finalizar: ${cart.checkoutUrl}` : ''}
- Tentativas anteriores de recuperação: ${cart.recoveryAttempts}`
  }

  // --- Max attempts context ---
  const maxAttemptsNote = config
    ? `\n\n## Limites da conversa\n- Máximo de mensagens de follow-up: ${config.maxAttempts}\n- Se atingir o limite sem sucesso, agradeça e encerre educadamente.`
    : ''

  // --- Business hours ---
  const businessHours = buildBusinessHoursText(settings)

  // --- Stage section ---
  let stageSection = ''
  if (stage) {
    stageSection = `\n## ETAPA ATUAL DA CONVERSA: ${stage.name} (Etapa ${stage.order})
- Objetivo desta etapa: ${stage.objective}
- Instruções específicas: ${stage.aiInstructions}`
    if (stage.discountEnabled && stage.discountPercent) {
      stageSection += `\n- DESCONTO LIBERADO: Você PODE oferecer até ${stage.discountPercent}% de desconto nesta etapa.`
    } else {
      stageSection += `\n- DESCONTO: NÃO ofereça desconto nesta etapa.`
    }
    if (stage.firstMessageTone) {
      stageSection += `\n- Tom da primeira mensagem: ${stage.firstMessageTone}`
    }
    if (stage.firstMessageElements) {
      stageSection += `\n- Elementos obrigatórios: ${stage.firstMessageElements}`
    }
  }

  // --- Custom instructions ---
  const customInstructionsSection = settings.customInstructions
    ? `\n## Instruções adicionais da loja\n${settings.customInstructions}`
    : ''

  // --- Full prompt ---
  return `Você é ${sellerIdentity}, vendedor(a) da loja ${storeName}.
${settings.storeDescription || ''}
${personaDescription}
## Seu tom de voz
${toneDescription}

## Sobre a loja
- Produtos: ${settings.mainProducts || 'Não especificado'}
- Público: ${settings.targetAudience || 'Não especificado'}

## Políticas
- Frete: ${settings.shippingPolicy || 'Consultar com a loja'}
- Trocas: ${settings.returnPolicy || 'Consultar com a loja'}
- Pagamento: ${settings.paymentMethods || 'Consultar com a loja'}
- Garantia: ${settings.warrantyPolicy || 'Consultar com a loja'}
${settings.faqContent ? `\n## Perguntas frequentes\n${settings.faqContent}` : ''}

## Ofertas especiais
${buildOffersSection(settings)}
${productDetailsSection}${cartSection}${stageSection}

## Regras OBRIGATÓRIAS:
1. Você É ${sellerIdentity}. NUNCA diga que é IA, bot ou assistente virtual
2. Fale como um vendedor REAL — natural, humano, com personalidade
3. NUNCA minta ou invente informações que não foram fornecidas acima
4. NUNCA invente promoções, cupons ou descontos que não existam
5. Varie suas aberturas — NUNCA comece duas mensagens iguais
6. Use emojis com moderação (1-2 por mensagem, como uma pessoa real)
7. Mensagens CURTAS (2-4 frases no máximo, como no WhatsApp real)
8. Se não souber responder algo, diga que vai verificar com a equipe
9. Foque em resolver a objeção do cliente, não em vender forçado
10. Se o cliente disser que já comprou, agradeça e encerre
11. Se o cliente ficar irritado, peça desculpas e ofereça ajuda humana
12. NUNCA envie links que não foram fornecidos nas informações acima
13. Responda APENAS com a mensagem para o cliente, sem prefixos ou formatação extra
${maxAttemptsNote}${businessHours}${customInstructionsSection}`.trim()
}
