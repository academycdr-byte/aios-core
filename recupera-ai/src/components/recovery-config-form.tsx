'use client'

import { RecoveryFlowBuilder } from '@/components/recovery-flow-builder'
import type { MockRecoveryConfig } from '@/lib/mock-stores'

interface RecoveryConfigFormProps {
  config: MockRecoveryConfig
  onSave: (config: MockRecoveryConfig) => void
}

export function RecoveryConfigForm({ config, onSave }: RecoveryConfigFormProps) {
  return <RecoveryFlowBuilder config={config} onSave={onSave} />
}
