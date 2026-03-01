/**
 * GET /api/cron/recovery
 * Vercel Cron endpoint - runs every 5 minutes to process pending recovery jobs
 * and calculate daily metrics.
 * Protected by CRON_SECRET (Vercel sends Authorization: Bearer <secret>).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processRecoveryJobs } from '@/lib/recovery/scheduler'
import { calculateDailyMetrics } from '@/lib/recovery/metrics'

export const maxDuration = 60 // Allow up to 60s for processing
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET - Vercel sends this as Authorization: Bearer <secret>
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '')
      if (token !== cronSecret) {
        console.warn('[Cron Recovery] Unauthorized cron request')
        return NextResponse.json(
          { error: 'unauthorized', message: 'Invalid CRON_SECRET' },
          { status: 401 }
        )
      }
    } else {
      // In development, allow without secret but log a warning
      console.warn('[Cron Recovery] CRON_SECRET not configured - running without auth')
    }

    console.log('[Cron Recovery] Starting recovery job processing...')
    const startTime = Date.now()

    // 1. Process recovery jobs (send messages)
    // Protected by testMode flag — only sends to whitelisted phones when testMode=true
    const recoveryStats = await processRecoveryJobs()

    // 2. Calculate daily metrics
    const metricsStats = await calculateDailyMetrics()

    const duration = Date.now() - startTime

    console.log(
      `[Cron Recovery] Completed in ${duration}ms:`,
      `processed=${recoveryStats.processed}`,
      `sent=${recoveryStats.sent}`,
      `skipped=${recoveryStats.skipped}`,
      `lost=${recoveryStats.lost}`,
      `errors=${recoveryStats.errors}`,
      `| metrics: stores=${metricsStats.storesProcessed}, upserted=${metricsStats.metricsUpserted}`
    )

    return NextResponse.json({
      ok: true,
      duration: `${duration}ms`,
      recovery: {
        processed: recoveryStats.processed,
        sent: recoveryStats.sent,
        skipped: recoveryStats.skipped,
        lost: recoveryStats.lost,
        errors: recoveryStats.errors,
      },
      metrics: {
        storesProcessed: metricsStats.storesProcessed,
        metricsUpserted: metricsStats.metricsUpserted,
        errors: metricsStats.errors.length,
      },
      details: recoveryStats.details,
    })
  } catch (error) {
    console.error('[Cron Recovery] Unhandled error:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
