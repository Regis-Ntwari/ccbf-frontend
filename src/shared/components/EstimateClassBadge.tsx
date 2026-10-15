import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import type { EstimateClass } from '@/shared/api/schemas'
import { ESTIMATE_CLASS_LABEL } from '@/shared/api/schemas'

const DESCRIPTIONS: Record<EstimateClass, string> = {
  1: 'Concept level: area, type, quality and location only. Expect ±15 %.',
  2: 'Preliminary: rooms, storeys, features and site known. Expect ±10 %.',
  3: 'Design stage: plans and specifications. Expect ±7 %.',
  4: 'Measured quantities from drawings. Expect ±4 %. Not valid until signed.',
  5: 'Tender-grade drawings and specifications.',
}

/** Always visible wherever a cost is shown (Feature 7, "trust"). */
export function EstimateClassBadge({ estimateClass, size = 'small' }: { estimateClass: EstimateClass; size?: 'small' | 'medium' }) {
  return (
    <Tooltip title={DESCRIPTIONS[estimateClass]}>
      <Chip
        size={size}
        label={`Level ${estimateClass} · ${ESTIMATE_CLASS_LABEL[estimateClass]}`}
        color={estimateClass <= 2 ? 'warning' : estimateClass === 3 ? 'info' : 'success'}
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  )
}
