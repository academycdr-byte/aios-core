/**
 * POST /api/webhooks/abacate-pay
 * Webhook da Abacate Pay — recebe notificação de pagamento.
 * Quando checkout.completed, marca fatura como paga e reativa billingActive.
 *
 * Configurar no dashboard da Abacate Pay:
 * URL: https://recupera-ai-five.vercel.app/api/webhooks/abacate-pay?webhookSecret=SEU_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { abacatePay } from '@/lib/abacate-pay'

export const dynamic = 'force-dynamic'

interface AbacateWebhookPayload {
  id: string
  event: string
  apiVersion: number
  devMode: boolean
  data: {
    id: string
    status: string
    amount: number
    methods: string[]
    metadata?: {
      storeId?: string
      invoiceId?: string
      type?: string
    }
    [key: string]: unknown
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret via query param
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('webhookSecret')

    if (secret && !abacatePay.validateWebhookSecret(secret)) {
      console.warn('[Webhook AbacatePay] Invalid webhook secret')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as AbacateWebhookPayload
    console.log(`[Webhook AbacatePay] Event: ${payload.event}, ID: ${payload.data?.id}`)

    // Handle checkout.completed — payment received
    if (payload.event === 'checkout.completed') {
      const { data } = payload
      const invoiceId = data.metadata?.invoiceId
      const storeId = data.metadata?.storeId

      if (!invoiceId) {
        // Try to find invoice by abacateCheckoutId
        const invoice = await prisma.billingInvoice.findFirst({
          where: { abacateCheckoutId: data.id },
        })
        if (invoice) {
          await markInvoicePaid(invoice.id, invoice.storeId, data.id)
        } else {
          console.warn(`[Webhook AbacatePay] No invoice found for checkout ${data.id}`)
        }
      } else {
        await markInvoicePaid(invoiceId, storeId || '', data.id)
      }
    }

    // Acknowledge webhook
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Webhook AbacatePay] Error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function markInvoicePaid(invoiceId: string, storeId: string, checkoutId: string) {
  // Update invoice status
  const invoice = await prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: 'PIX',
    },
  })

  // Reactivate billing for the store
  const targetStoreId = storeId || invoice.storeId
  await prisma.store.update({
    where: { id: targetStoreId },
    data: { billingActive: true },
  })

  console.log(
    `[Webhook AbacatePay] Invoice ${invoiceId} marked as PAID. Store ${targetStoreId} billing reactivated.`
  )
}
