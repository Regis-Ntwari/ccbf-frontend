import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useTranslation } from 'react-i18next'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined'
import { TraceDrawer } from './TraceDrawer'

/** "Why this number?" affordance next to any currency figure (Feature 8). */
export function TraceButton({ estimateId, figureId, size = 'small' }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Tooltip title={t('result.why')}>
        <IconButton size={size} aria-label={t('result.why')} onClick={() => setOpen(true)}>
          <HelpOutlineIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      {open && <TraceDrawer estimateId={estimateId} figureId={figureId} onClose={() => setOpen(false)} />}
    </>
  )
}
