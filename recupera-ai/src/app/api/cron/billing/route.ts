/**
 * GET /api/cron/billing
 * Cron job de billing — executa 2 funções:
 *
 * 1. FATURAMENTO MENSAL (dia 1º): Calcula valor recuperado do mês anterior,
 *    gera fatura de 10% e cria checkout na Abacate Pay.
 *
 * 2. CHECK DE INADIMPLÊNCIA (diário): Verifica faturas vencidas há mais de
 *    1 dia e desativa o billing da loja (IA para de enviar mensagens).
 *
 * Vercel Cron: roda diariamente às 06:00 UTC (03:00 BRT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { abacatePay } from '@/lib/abacate-pay'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '')
      if (token !== cronSecret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const results = {
      invoicesGenerated: 0,
      invoicesSkipped: 0,
      overdueMarked: 0,
      storesDeactivated: 0,
      errors: [] as string[],
    }

    // ============================================================
    // 1. FATURAMENTO MENSAL — gera faturas do mês anterior (dia 1º)
    // ============================================================
    const isFirstDay = now.getUTCDate() === 1
    if (isFirstDay) {
      console.log('[Billing Cron] Dia 1º — gerando faturas do mês anterior...')
      await generateMonthlyInvoices(now, results)
    }

    // ============================================================
    // 2. CHECK DE INADIMPLÊNCIA — verifica faturas vencidas (diário)
    // ============================================================
    console.log('[Billing Cron] Verificando faturas vencidas...')
    await checkOverdueInvoices(now, results)

    console.log('[Billing Cron] Concluído:', results)

    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    console.error('[Billing Cron] Error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================
// GENERATE MONTHLY INVOICES
// ============================================================

async function generateMonthlyInvoices(
  now: Date,
  results: { invoicesGenerated: number; invoicesSkipped: number; errors: string[] }
) {
  // Previous month period
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // Get all active stores
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  for (const store of stores) {
    try {
      // Check if invoice already exists for this period
      const existing = await prisma.billingInvoice.findFirst({
        where: {
          storeId: store.id,
          periodStart: periodStart,
          periodEnd: periodEnd,
        },
      })

      if (existing) {
        results.invoicesSkipped++
        continue
      }

      // Calculate recovered value in the period
      const recoveries = await prisma.abandonedCart.aggregate({
        where: {
          storeId: store.id,
          status: { in: ['RECOVERED', 'PAID'] },
          recoveredAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        _sum: { recoveredValue: true },
      })

      const recoveredValue = recoveries._sum.recoveredValue || 0

      // Skip if nothing was recovered
      if (recoveredValue <= 0) {
        results.invoicesSkipped++
        continue
      }

      const commissionRate = 0.10
      const amount = Math.round(recoveredValue * commissionRate * 100) / 100

      // Due date: 5 days after generation
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + 5)

      // Format period label
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
      ]
      const periodLabel = `${monthNames[periodStart.getMonth()]}/${periodStart.getFullYear()}`

      // Create invoice in DB first
      const invoice = await prisma.billingInvoice.create({
        data: {
          storeId: store.id,
          periodStart,
          periodEnd,
          recoveredValue,
          commissionRate,
          amount,
          status: 'PENDING',
          dueDate,
        },
      })

      // Create Abacate Pay checkout
      try {
        const amountCents = Math.round(amount * 100) // Convert to centavos
        const checkout = await abacatePay.createBillingCheckout({
          amount: amountCents,
          storeId: store.id,
          invoiceId: invoice.id,
          storeName: store.name,
          periodLabel,
        })

        // Update invoice with checkout info
        await prisma.billingInvoice.update({
          where: { id: invoice.id },
          data: {
            abacateCheckoutId: checkout.checkoutId,
            abacateCheckoutUrl: checkout.checkoutUrl,
          },
        })

        console.log(
          `[Billing Cron] Fatura gerada: store=${store.name}, valor=${amount}, checkout=${checkout.checkoutId}`
        )
      } catch (checkoutError) {
        // Invoice created but checkout failed — can retry later
        console.error(`[Billing Cron] Checkout creation failed for store ${store.id}:`, checkoutError)
        results.errors.push(`Checkout failed for store ${store.id}: ${checkoutError}`)
      }

      results.invoicesGenerated++
    } catch (error) {
      console.error(`[Billing Cron] Error processing store ${store.id}:`, error)
      results.errors.push(`Store ${store.id}: ${error}`)
    }
  }
}

// ============================================================
// CHECK OVERDUE INVOICES
// ============================================================

async function checkOverdueInvoices(
  now: Date,
  results: { overdueMarked: number; storesDeactivated: number; errors: string[] }
) {
  // Find PENDING invoices where dueDate + 1 day has passed
  const gracePeriodEnd = new Date(now)
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 1) // 1 day grace

  const overdueInvoices = await prisma.billingInvoice.findMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: gracePeriodEnd },
    },
    include: {
      store: { select: { id: true, name: true, billingActive: true } },
    },
  })

  for (const invoice of overdueInvoices) {
    try {
      // Mark invoice as OVERDUE
      await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      })
      results.overdueMarked++

      // Deactivate billing for the store (IA stops sending messages)
      if (invoice.store.billingActive) {
        await prisma.store.update({
          where: { id: invoice.storeId },
          data: { billingActive: false },
        })
        results.storesDeactivated++

        console.log(
          `[Billing Cron] Store "${invoice.store.name}" desativada por inadimplência. Fatura: ${invoice.id}`
        )
      }
    } catch (error) {
      console.error(`[Billing Cron] Error marking overdue invoice ${invoice.id}:`, error)
      results.errors.push(`Invoice ${invoice.id}: ${error}`)
    }
  }
}
