import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { useTranslation } from 'react-i18next'

import { ESTIMATE_CLASS_LABEL } from '@/shared/api/schemas'
import { FONT_MONO } from '@/shared/theme/theme'

/** Always visible wherever a cost is shown (Feature 7). Level 1 is never a BOQ. */
export function EstimateClassBadge({ estimateClass, size = 'small' }) {
  const { t } = useTranslation()
  return (
    <Tooltip title={t(`shell.estimateClass.desc.${estimateClass}`, { defaultValue: '' })}>
      <Chip
        size={size}
        variant="outlined"
        color={estimateClass <= 2 ? 'warning' : estimateClass === 3 ? 'info' : 'success'}
        label={
          <>
            <span style={{ fontFamily: FONT_MONO, marginRight: 6 }}>L{estimateClass}</span>
            {t(`shell.estimateClass.label.${estimateClass}`, { defaultValue: ESTIMATE_CLASS_LABEL[estimateClass] })}
          </>
        }
        sx={{ fontWeight: 500 }}
      />
    </Tooltip>
  )
}
