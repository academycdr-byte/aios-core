/**
 * System Prompt Builder
 * Constructs the AI system prompt from store settings, recovery config, and cart data.
 * The prompt shapes the AI's identity, tone, knowledge, and behavioral rules.
 */

import type { StoreSettings, RecoveryConfig, AbandonedCart, CartItem } from '@/types'

// ============================================================
// TONE DESCRIPTIONS
// ============================================================

const TONE_MAP: Record<string, string> = {
  profissional:
    'Seja profissional e objetivo. Use linguagem clara, educada e direta. Transmita confianca e credibilidade.',
  amigavel:
    'Seja amigavel e acolhedor. Use linguagem leve, proxima e calorosa. Trate o cliente como um amigo que voce quer ajudar.',
  casual:
    'Seja casual e descontraido. Use linguagem informal, girias leves e um tom jovem. Fale como se estivesse batendo papo.',
  persuasivo:
    'Seja persuasivo e estrategico. Use gatilhos de urgencia, escassez e prova social quando pertinente. Foque nos beneficios, nao nas caracteristicas.',
}

// ============================================================
// CART TYPE LABELS
// ============================================================

const CART_TYPE_LABEL: Record<string, string> = {
  ABANDONED_CART: 'Carrinho abandonado',
  PIX_PENDING: 'Pix pendente',
  CARD_DECLINED: 'Cartao recusado',
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
        `Voce pode oferecer o cupom ${settings.couponCode} com ${settings.couponDiscount}% de desconto.`
      )
    } else if (settings.maxDiscountPercent) {
      lines.push(
        `Voce pode oferecer ate ${settings.maxDiscountPercent}% de desconto se o cliente hesitar.`
      )
    }
  } else {
    lines.push('Nao ha ofertas ou descontos disponiveis no momento. NAO invente cupons.')
  }

  return lines.join('\n')
}

function buildBusinessHoursText(settings: StoreSettings): string {
  if (!settings.businessHoursStart || !settings.businessHoursEnd) {
    return ''
  }
  return `\n## Horario de funcionamento\n- Atendimento: ${settings.businessHoursStart} as ${settings.businessHoursEnd} (${settings.timezone})\n- Se o cliente enviar mensagem fora do horario, informe educadamente o horario de atendimento.`
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
 */
export function buildSystemPrompt(
  settings: StoreSettings,
  config: RecoveryConfig | null,
  cart: AbandonedCart | null
): string {
  const aiName = settings.aiName || 'Assistente'
  const storeName = settings.storeName || 'a loja'
  const toneDescription = TONE_MAP[settings.aiTone] || TONE_MAP.profissional

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
- Tentativas anteriores de recuperacao: ${cart.recoveryAttempts}`
  }

  // --- Max attempts context ---
  const maxAttemptsNote = config
    ? `\n\n## Limites da conversa\n- Maximo de mensagens de follow-up: ${config.maxAttempts}\n- Se atingir o limite sem sucesso, agradeca e encerre educadamente.`
    : ''

  // --- Business hours ---
  const businessHours = buildBusinessHoursText(settings)

  // --- Custom instructions ---
  const customInstructionsSection = settings.customInstructions
    ? `\n## Instrucoes adicionais da loja\n${settings.customInstructions}`
    : ''

  // --- Full prompt ---
  return `Voce e ${aiName}, vendedor(a) da loja ${storeName}.
${settings.storeDescription || ''}

## Seu tom de voz
${toneDescription}

## Sobre a loja
- Produtos: ${settings.mainProducts || 'Nao especificado'}
- Publico: ${settings.targetAudience || 'Nao especificado'}

## Politicas
- Frete: ${settings.shippingPolicy || 'Consultar com a loja'}
- Trocas: ${settings.returnPolicy || 'Consultar com a loja'}
- Pagamento: ${settings.paymentMethods || 'Consultar com a loja'}
- Garantia: ${settings.warrantyPolicy || 'Consultar com a loja'}
${settings.faqContent ? `\n## Perguntas frequentes\n${settings.faqContent}` : ''}

## Ofertas especiais
${buildOffersSection(settings)}
${cartSection}

## Regras OBRIGATORIAS:
1. NUNCA minta ou invente informacoes
2. NUNCA invente promocoes que nao existam
3. Seja natural, como um vendedor humano
4. Nao use linguagem de bot ou muito formal
5. Se nao souber responder algo, diga que vai verificar
6. Foque em resolver a objecao do cliente
7. Use emojis com moderacao (1-2 por mensagem)
8. Mensagens curtas (2-4 frases no maximo)
9. Se o cliente disser que ja comprou, agradeca e encerre
10. Se o cliente ficar irritado, peca desculpas e ofereca ajuda humana
11. NUNCA envie links que nao foram fornecidos nas informacoes acima
12. Responda APENAS com a mensagem para o cliente, sem prefixos ou formatacao extra
${maxAttemptsNote}${businessHours}${customInstructionsSection}`.trim()
}
